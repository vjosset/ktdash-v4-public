'use client'

import { RosterLink, UserLink } from '@/components/shared/Links'
import MatchRecord from '@/components/shared/MatchRecord'
import { Button, Input, Label, Modal } from '@/components/ui'
import { parseRosterId } from '@/lib/utils/utils'
import { MatchOutcome, MatchResultPlain, MatchResultRosterInfo, RosterIdentity, RosterPlain } from '@/types'
import clsx from 'clsx'
import { useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'sonner'

type Outcome = 'W' | 'L' | 'D'

/*
  Every row is read from the perspective of the roster whose page we are on.
  Slot A / slot B never surface in the UI - the reporter should never have to
  reason about who is "A".
*/
function perspectiveFor(match: MatchResultPlain, myRosterId: string) {
  const isSlotA = match.rosterA.rosterId === myRosterId
  const opponent: MatchResultRosterInfo = isSlotA ? match.rosterB : match.rosterA
  const outcome: Outcome = match.result === 'D' ? 'D' : (match.result === 'A') === isSlotA ? 'W' : 'L'

  return {
    // Slot A is always the reporter, so this is also "did I report this?"
    isReporter: isSlotA,
    opponent,
    outcome,
  }
}

const outcomeClasses: Record<Outcome, string> = {
  W: 'text-green-500 border-green-500',
  L: 'text-red-500 border-red-500',
  D: 'text-muted border-border',
}

function formatMatchDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/*
  Renders a side of a match. A deleted roster keeps its snapshotted name, struck
  through, with nothing to link to.
*/
function OpponentLabel({ opponent }: { opponent: MatchResultRosterInfo }) {
  if (!opponent.rosterId) {
    return <span className="line-through text-muted">{opponent.rosterName}</span>
  }

  return <RosterLink rosterId={opponent.rosterId} rosterName={opponent.rosterName} />
}

export default function MatchResultsTab({
  roster,
  isOwner,
  isActive,
}: {
  roster: RosterPlain
  isOwner: boolean
  isActive: boolean
}) {
  const [matches, setMatches] = useState<MatchResultPlain[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [removing, setRemoving] = useState<MatchResultPlain | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const loadMatches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rosters/${roster.rosterId}/matchResults`)
      if (!res.ok) throw new Error('Failed')
      setMatches(await res.json())
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
    loadMatches()
  }, [isActive, loadMatches])

  const handleConfirm = async (match: MatchResultPlain) => {
    setBusyId(match.matchResultId)
    try {
      const res = await fetch(`/api/matchResults/${match.matchResultId}/confirm`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
      const updated: MatchResultPlain = await res.json()
      setMatches(prev => (prev ?? []).map(m => (m.matchResultId === updated.matchResultId ? updated : m)))
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
  const handleRemove = async (match: MatchResultPlain) => {
    setBusyId(match.matchResultId)
    try {
      const res = await fetch(`/api/matchResults/${match.matchResultId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setMatches(prev => (prev ?? []).filter(m => m.matchResultId !== match.matchResultId))
      toast.success('Battle removed')
    } catch {
      toast.error('Failed to remove battle')
    } finally {
      setBusyId(null)
      setRemoving(null)
    }
  }

  // Rule 9: records count confirmed matches only
  const record = (matches ?? []).reduce(
    (acc, match) => {
      if (!match.isConfirmed) return acc
      const { outcome } = perspectiveFor(match, roster.rosterId)
      if (outcome === 'W') acc.wins += 1
      else if (outcome === 'L') acc.losses += 1
      else acc.draws += 1
      return acc
    },
    { wins: 0, losses: 0, draws: 0 },
  )

  const removalIsDispute = removing ? !perspectiveFor(removing, roster.rosterId).isReporter : false

  return (
    <div className="max-w-2xl mx-auto px-2">
      {/* Record */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <MatchRecord wins={record.wins} losses={record.losses} draws={record.draws} />

        <div className="flex items-center gap-2">
          <button
            onClick={loadMatches}
            className="text-muted hover:text-main transition-colors p-1"
            title="Refresh"
            aria-label="Refresh battles"
          >
            <FiRefreshCw className={clsx(loading && 'animate-spin')} />
          </button>
          {isOwner && <Button onClick={() => setShowRecordModal(true)}>Record Battle</Button>}
        </div>
      </div>

      {/* History - confirmed and pending in one list, newest first */}
      {matches === null ? (
        <p className="text-muted text-center py-8">Loading…</p>
      ) : matches.length === 0 ? (
        <p className="text-muted text-center py-8">
          No battles recorded yet.
          {isOwner && ' Record one after your next game.'}
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {matches.map(match => {
            const { isReporter, opponent, outcome } = perspectiveFor(match, roster.rosterId)
            const awaitingMe = !match.isConfirmed && !isReporter
            const busy = busyId === match.matchResultId

            return (
              <li key={match.matchResultId} className="py-2 flex items-start gap-3">
                <span
                  className={clsx(
                    'flex-shrink-0 w-7 h-7 rounded border flex items-center justify-center font-bold',
                    outcomeClasses[outcome],
                    !match.isConfirmed && 'opacity-50',
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

                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted">
                    <span>{formatMatchDate(match.matchDate)}</span>
                    {!match.isConfirmed && (
                      <span className="italic">
                        {isReporter ? '· Awaiting their confirmation' : '· Awaiting your confirmation'}
                      </span>
                    )}
                  </div>

                  {/* Confirm and Dispute are weighted equally - disputing is not an accusation */}
                  {isOwner && !match.isConfirmed && (
                    <div className="flex gap-2 mt-2">
                      {awaitingMe && (
                        <Button onClick={() => handleConfirm(match)} disabled={busy}>
                          Confirm
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => setRemoving(match)} disabled={busy}>
                        {awaitingMe ? 'Dispute' : 'Withdraw'}
                      </Button>
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
            setMatches(prev => [created, ...(prev ?? [])])
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
              <Button onClick={() => handleRemove(removing)} disabled={busyId === removing.matchResultId}>
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
  onCreated: (match: MatchResultPlain) => void
}) {
  const [input, setInput] = useState('')
  const [opponent, setOpponent] = useState<RosterIdentity | null>(null)
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null)
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
      const res = await fetch('/api/matchResults', {
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
        const duplicate: MatchResultPlain | undefined = body?.duplicateOf
        const when = duplicate?.matchDate ? formatMatchDate(duplicate.matchDate) : 'recently'
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

      const created: MatchResultPlain = await res.json()
      toast.success('Battle recorded — waiting on your opponent to confirm')
      onCreated(created)
    } catch {
      setError('Failed to record battle.')
    } finally {
      setSubmitting(false)
    }
  }

  const outcomeOptions: { label: string; value: MatchOutcome }[] = [
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
          their own roster, and it counts toward both records once they do.
        </p>
      </div>
    </Modal>
  )
}
