'use client'

import BattleRecord from '@/components/shared/BattleRecord'
import { RosterLink, UserLink } from '@/components/shared/Links'
import { Button, Input, Label, Modal, SectionTitle } from '@/components/ui'
import { parseRosterId, toLocalDateTime } from '@/lib/utils/utils'
import { BattleOutcome, BattlePlain, BattleRosterInfo, RosterIdentity, RosterPlain } from '@/types'
import clsx from 'clsx'
import { useCallback, useEffect, useState } from 'react'
import { FiCheck, FiEdit2, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { toast } from 'sonner'

type Outcome = 'W' | 'L' | 'D'

/*
  Every row is read from the perspective of the roster whose page we are on.
  Slot A / slot B never surface in the UI - the reporter should never have to
  reason about who is "A".
*/
function perspectiveFor(battle: BattlePlain, myRosterId: string) {
  const isSlotA = battle.rosterA.rosterId === myRosterId
  const opponent: BattleRosterInfo = isSlotA ? battle.rosterB : battle.rosterA
  const outcome: Outcome = battle.result === 'D' ? 'D' : (battle.result === 'A') === isSlotA ? 'W' : 'L'

  return {
    // Slot A is always the reporter, so this is also "did I report this?"
    isReporter: isSlotA,
    opponent,
    outcome,
  }
}

const outcomeClasses: Record<Outcome, string> = {
  W: 'text-green-500',
  L: 'text-red-500',
  D: 'text-muted',
}

/*
  Renders a side of a battle. A deleted roster keeps its snapshotted name, struck
  through, with nothing to link to.
*/
function OpponentLabel({ opponent }: { opponent: BattleRosterInfo }) {
  if (!opponent.rosterId) {
    return <span className="line-through text-muted">{opponent.rosterName}</span>
  }

  return <RosterLink rosterId={opponent.rosterId} rosterName={opponent.rosterName} />
}

export default function BattlesTab({
  roster,
  isOwner,
  isActive,
}: {
  roster: RosterPlain
  isOwner: boolean
  isActive: boolean
}) {
  const [battles, setBattles] = useState<BattlePlain[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [removing, setRemoving] = useState<BattlePlain | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const loadBattles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rosters/${roster.rosterId}/battles`)
      if (!res.ok) throw new Error('Failed')
      setBattles(await res.json())
    } catch {
      toast.error('Failed to load battles')
    } finally {
      setLoading(false)
    }
  }, [roster.rosterId])

  // Reload every time the tab is shown, so a report filed by the opponent a
  // moment ago appears without a page refresh
  useEffect(() => {
    if (!isActive) return
    loadBattles()
  }, [isActive, loadBattles])

  const handleConfirm = async (battle: BattlePlain) => {
    setBusyId(battle.battleId)
    try {
      const res = await fetch(`/api/battles/${battle.battleId}/confirm`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
      const updated: BattlePlain = await res.json()
      setBattles(prev => (prev ?? []).map(b => (b.battleId === updated.battleId ? updated : b)))
      toast.success('Battle confirmed')
    } catch {
      toast.error('Failed to confirm battle')
    } finally {
      setBusyId(null)
    }
  }

  /*
    Disputing (as the opponent) and withdrawing (as the reporter) are the same
    operation on the data - only the wording differs.
  */
  const handleRemove = async (battle: BattlePlain) => {
    setBusyId(battle.battleId)
    try {
      const res = await fetch(`/api/battles/${battle.battleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setBattles(prev => (prev ?? []).filter(b => b.battleId !== battle.battleId))
      toast.success('Battle removed')
    } catch {
      toast.error('Failed to remove battle')
    } finally {
      setBusyId(null)
      setRemoving(null)
    }
  }

  // Rule 9: records count confirmed battles only
  const record = (battles ?? []).reduce(
    (acc, battle) => {
      if (!battle.isConfirmed) return acc
      const { outcome } = perspectiveFor(battle, roster.rosterId)
      if (outcome === 'W') acc.wins += 1
      else if (outcome === 'L') acc.losses += 1
      else acc.draws += 1
      return acc
    },
    { wins: 0, losses: 0, draws: 0 },
  )

  // Draws are in the denominator, matching how the killteam stats tab reads
  const recordedBattles = record.wins + record.losses + record.draws
  const winRate = recordedBattles > 0 ? `${Math.round((record.wins / recordedBattles) * 100)}%` : '—'

  const removalIsDispute = removing ? !perspectiveFor(removing, roster.rosterId).isReporter : false

  return (
    <div className="max-w-2xl mx-auto px-2">
      {/* Record */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="border border-border rounded px-4 py-2">
          <BattleRecord wins={record.wins} losses={record.losses} draws={record.draws} winRate={winRate} />
        </div>

        {isOwner && <Button onClick={() => setShowRecordModal(true)}>Record Battle</Button>}
      </div>

      {/* Refresh sits with the heading rather than the Record button - it acts on
          the list below it, not on the record above */}
      <div className="flex items-center gap-2">
        <SectionTitle>Battle History</SectionTitle>
        <button
          onClick={loadBattles}
          className="text-muted hover:text-main transition-colors p-1"
          title="Refresh"
          aria-label="Refresh battles"
        >
          <FiRefreshCw className={clsx(loading && 'animate-spin')} />
        </button>
      </div>

      {/* History - confirmed and pending in one list, newest first */}
      {battles === null ? (
        <p className="text-muted text-center py-8">Loading…</p>
      ) : battles.length === 0 ? (
        <p className="text-muted text-center py-8">
          No battles recorded yet.
          {isOwner && ' Record one after your next battle.'}
        </p>
      ) : (
        <ul className="list-none pl-0 divide-y divide-border border-y border-border">
          {battles.map(battle => {
            const { isReporter, opponent, outcome } = perspectiveFor(battle, roster.rosterId)
            const awaitingMe = !battle.isConfirmed && !isReporter
            const busy = busyId === battle.battleId

            return (
              <li key={battle.battleId} className="py-2">
                {/* The timestamp heads the entry on its own line, so it never has
                    to share a row with the action buttons - confirmed and pending
                    battles then lay out identically */}
                <div className="text-xs text-muted">{toLocalDateTime(battle.battleDate)}</div>

                <div className="flex items-center gap-3 mt-0.5">
                  <span
                    className={clsx(
                      'flex-shrink-0 w-4 text-center font-bold',
                      outcomeClasses[outcome],
                      !battle.isConfirmed && 'opacity-50',
                    )}
                    title={outcome === 'W' ? 'Win' : outcome === 'L' ? 'Loss' : 'Draw'}
                  >
                    {outcome}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      <span className="text-muted">vs</span>
                      <OpponentLabel opponent={opponent} />
                      <span className="text-muted">by</span>
                      <UserLink userName={opponent.userName} />
                    </div>

                    {!battle.isConfirmed && (
                      <div className="mt-0.5 text-xs text-muted italic">
                        {isReporter ? 'Awaiting their confirmation' : 'Awaiting your confirmation'}
                      </div>
                    )}
                  </div>

                  {/*
                    Confirm and Dispute are weighted equally - disputing is not an
                    accusation - so both are plain icon buttons, distinguished only
                    by the hover colour. Only the trash is guarded by a modal:
                    confirming is terminal under rule 5 but is also the agreeable
                    outcome, whereas the trash destroys the row for both players.
                  */}
                  {isOwner && !battle.isConfirmed && (
                    <div className="flex items-center justify-end gap-1 flex-shrink-0">
                      {awaitingMe && (
                        <button
                          onClick={() => handleConfirm(battle)}
                          disabled={busy}
                          className="text-muted hover:text-green-500 transition-colors p-1 disabled:opacity-40 disabled:hover:text-muted"
                          title="Confirm"
                          aria-label="Confirm battle"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        onClick={() => setRemoving(battle)}
                        disabled={busy}
                        className="text-muted hover:text-red-500 transition-colors p-1 disabled:opacity-40 disabled:hover:text-muted"
                        title={awaitingMe ? 'Dispute' : 'Withdraw'}
                        aria-label={awaitingMe ? 'Dispute battle' : 'Withdraw battle'}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {showRecordModal && (
        <RecordBattleModal
          roster={roster}
          onClose={() => setShowRecordModal(false)}
          onCreated={created => {
            setBattles(prev => [created, ...(prev ?? [])])
            setShowRecordModal(false)
          }}
        />
      )}

      {removing && (
        <Modal
          title={removalIsDispute ? 'Dispute this battle?' : 'Withdraw this battle?'}
          onClose={() => setRemoving(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleRemove(removing)} disabled={busyId === removing.battleId}>
                {removalIsDispute ? 'Dispute' : 'Withdraw'}
              </Button>
            </div>
          }
        >
          <p className="text-sm">
            {removalIsDispute
              ? 'This removes the reported result. It will not count toward either record, and your opponent can report it again.'
              : 'This removes the result you reported. It will not count toward either record.'}
          </p>
        </Modal>
      )}
    </div>
  )
}

/*
  Report a battle. Outcome buttons are phrased in the first person so the
  reporter never has to think about slots; they map to slot values on submit.
*/
function RecordBattleModal({
  roster,
  onClose,
  onCreated,
}: {
  roster: RosterPlain
  onClose: () => void
  onCreated: (battle: BattlePlain) => void
}) {
  const [input, setInput] = useState('')
  const [opponent, setOpponent] = useState<RosterIdentity | null>(null)
  const [outcome, setOutcome] = useState<BattleOutcome | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const handleLookup = async () => {
    const opponentRosterId = parseRosterId(input)
    if (!opponentRosterId) return

    setLookingUp(true)
    setError(null)
    try {
      const res = await fetch(`/api/rosters/${opponentRosterId}/identity`)
      if (!res.ok) throw new Error('Not found')
      const found: RosterIdentity = await res.json()

      if (found.rosterId === roster.rosterId) {
        setError('That is this roster. Enter your opponent’s roster.')
        return
      }
      if (found.userId === roster.userId) {
        setError('That roster is also yours. A battle needs two different players.')
        return
      }

      setOpponent(found)
    } catch {
      setError('Roster not found. Check the ID and try again.')
    } finally {
      setLookingUp(false)
    }
  }

  const handleSubmit = async (acknowledgeDuplicate: boolean) => {
    if (!opponent || !outcome) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rosterAId: roster.rosterId,
          rosterBId: opponent.rosterId,
          result: outcome,
          acknowledgeDuplicate,
        }),
      })

      if (res.status === 409) {
        // Duplicate guard warns, it does not block
        const body = await res.json()
        const duplicate: BattlePlain | undefined = body?.duplicateOf
        const when = duplicate?.battleDate ? toLocalDateTime(duplicate.battleDate) : 'recently'
        const reportedByMe = duplicate?.rosterA?.rosterId === roster.rosterId
        setDuplicateWarning(
          reportedByMe
            ? `You already reported a battle against this roster on ${when}. Report it anyway?`
            : `Your opponent already recorded a battle against this roster on ${when}. Confirm theirs from your battle list rather than recording it again.`,
        )
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? 'Failed to record battle.')
        return
      }

      const created: BattlePlain = await res.json()
      toast.success('Battle recorded — waiting on your opponent to confirm')
      onCreated(created)
    } catch {
      setError('Failed to record battle.')
    } finally {
      setSubmitting(false)
    }
  }

  const outcomeOptions: { label: string; value: BattleOutcome }[] = [
    { label: 'I Won', value: 'A' },
    { label: 'Draw', value: 'D' },
    { label: 'They Won', value: 'B' },
  ]

  return (
    <Modal
      title="Record Battle"
      onClose={onClose}
      footer={
        duplicateWarning ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={submitting}>
              Report Anyway
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={!opponent || !outcome || submitting}>
              {submitting ? 'Recording…' : 'Record Battle'}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-3">
        {/* My roster - fixed */}
        <div className="flex items-center justify-between gap-2">
          <Label>Your Roster ID</Label>
          <span className="font-mono uppercase select-all">{roster.rosterId}</span>
        </div>

        {/* Opponent */}
        <div className="flex items-center justify-between gap-2">
          <Label>Opponent Roster ID</Label>
          {opponent ? (
            <div className="flex flex-wrap items-center gap-2 text-sm px-1">
              {opponent.rosterName} { ' ' }
              by
              <UserLink userName={opponent.userName} newTab />
              <button
                className="text-muted hover:text-main transition-colors"
                title="Change opponent"
                aria-label="Change opponent"
                onClick={() => {
                  setOpponent(null)
                  setOutcome(null)
                  setDuplicateWarning(null)
                }}
              >
                <FiEdit2 size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={e => {
                  setInput(e.target.value.toUpperCase())
                  setError(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="Roster ID or URL"
                autoComplete="off"
              />
              <Button variant="ghost" onClick={handleLookup} disabled={lookingUp || !input.trim()}>
                {lookingUp ? 'Finding…' : 'Find'}
              </Button>
            </div>
          )}
        </div>

        {/* Outcome, phrased from the reporter's point of view */}
        {opponent && (
          <div className="flex flex-col gap-2">
            <Label>Result</Label>
            <div className="grid grid-cols-3 gap-2">
              {outcomeOptions.map(({ label, value }) => (
                <Button
                  key={value}
                  variant={outcome === value ? 'highlighted' : 'ghost'}
                  className="justify-center"
                  onClick={() => {
                    setOutcome(value)
                    setDuplicateWarning(null)
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {duplicateWarning && <p className="text-sm text-muted">{duplicateWarning}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <p className="text-sm text-muted">
          Only one of you records the battle. Your opponent confirms it from the Battles tab on
          their own roster, and it counts toward both rosters once they do.
        </p>
      </div>
    </Modal>
  )
}
