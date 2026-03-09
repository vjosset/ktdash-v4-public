'use client'

import { RosterLink, UserLink } from '@/components/shared/Links'
import { Button } from '@/components/ui'
import { MatchResultPlain } from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { toast } from 'sonner'

function getWLD(history: MatchResultPlain[], userId: string) {
  let wins = 0, losses = 0, draws = 0
  for (const m of history) {
    if (!m.rosterBConfirmed) continue
    if (m.result === 'D') { draws++; continue }
    const isA = m.rosterA?.userId === userId
    if ((isA && m.result === 'A') || (!isA && m.result === 'B')) wins++
    else losses++
  }
  return { wins, losses, draws }
}

function resultLabel(match: MatchResultPlain, userId: string): { letter: string; cls: string; pending: boolean } {
  const pending = !match.rosterBConfirmed
  if (match.result === 'D') return { letter: 'D', cls: 'text-muted-foreground', pending }
  const isA = match.rosterA?.userId === userId
  const win = (isA && match.result === 'A') || (!isA && match.result === 'B')
  return win
    ? { letter: 'W', cls: 'text-main', pending }
    : { letter: 'L', cls: 'text-muted-foreground', pending }
}

export default function UserBattlesTab({ userId, isOwner }: { userId: string; isOwner: boolean }) {
  const [history, setHistory] = useState<MatchResultPlain[]>([])
  const [pending, setPending] = useState<MatchResultPlain[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const histRes = await fetch(`/api/match-results/history/user/${userId}`)
      if (histRes.ok) setHistory(await histRes.json())

      if (isOwner) {
        const pendRes = await fetch('/api/match-results/pending')
        if (pendRes.ok) setPending(await pendRes.json())
      }
    } finally {
      setLoading(false)
    }
  }, [userId, isOwner])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (matchResultId: number) => {
    try {
      const res = await fetch(`/api/match-results/${matchResultId}/confirm`, { method: 'PATCH' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Battle confirmed')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm')
    }
  }

  const handleDispute = async (matchResultId: number) => {
    try {
      const res = await fetch(`/api/match-results/${matchResultId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Battle disputed and removed')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispute')
    }
  }

  const handleCancel = async (matchResultId: number) => {
    try {
      const res = await fetch(`/api/match-results/${matchResultId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Battle record cancelled')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  const { wins, losses, draws } = getWLD(history, userId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* W/L/D Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-6 border border-main px-2 py-1 rounded-md">
          <div className="text-center">
            <div className="text-3xl stat text-main">{wins}</div>
            <div className="text-xs text-muted uppercase tracking-wide">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-3xl stat text-foreground">{losses}</div>
            <div className="text-xs text-muted uppercase tracking-wide">Losses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl stat text-muted">{draws}</div>
            <div className="text-xs text-muted uppercase tracking-wide">Draws</div>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1"
          title="Refresh"
        >
          <FiRefreshCw size={14} />
        </button>
      </div>

      {/* Pending confirmations (incoming as rosterB) */}
      {isOwner && pending.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-semibold">Awaiting Your Confirmation</h5>
          {pending.map(m => {
            const opponent = m.rosterA
            const myRoster = m.rosterB
            const theyRecorded = m.result === 'B' ? 'They recorded: I Won' : m.result === 'A' ? 'They recorded: You Won' : 'They recorded: Draw'
            return (
              <div key={m.matchResultId} className="border border-border rounded px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm">
                  {myRoster && <><RosterLink rosterId={myRoster.rosterId} rosterName={myRoster.rosterName} />{' '}</>}
                  <span className="font-medium">vs {opponent?.rosterName ?? 'Unknown'}</span>
                  <span className="text-muted-foreground ml-2">by {opponent?.userName ?? ''}</span>
                  <span className="text-muted-foreground ml-2 text-xs">— {theyRecorded}</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleConfirm(m.matchResultId)}>Confirm</Button>
                  <Button variant="ghost" onClick={() => handleDispute(m.matchResultId)}>Dispute</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Battle history */}
      <div className="space-y-2">
        <h5 className="font-semibold">Battle History</h5>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && history.length === 0 && (
          <p className="text-sm text-muted-foreground">No battles recorded yet.</p>
        )}
        {history.map(m => {
          const { letter, cls, pending } = resultLabel(m, userId)
          const isA = m.rosterA?.userId === userId
          const myRoster = isA ? m.rosterA : m.rosterB
          const opponent = isA ? m.rosterB : m.rosterA
          const d = new Date(m.matchDate)
          const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          const timePart = d.toLocaleTimeString(undefined, { timeStyle: 'short' })
          return (
            <div key={m.matchResultId} className="flex items-center justify-between border-b border-border pb-2 text-sm">
              <div className="flex items-center gap-3">
                <span className={`font-bold w-5 text-center ${cls}`}>{letter}</span>
                <span className="flex items-center flex-wrap gap-1">
                  {myRoster ? <RosterLink rosterId={myRoster.rosterId} rosterName={myRoster.rosterName} /> : <span>Unknown</span>}
                  vs
                  {opponent ? <RosterLink rosterId={opponent.rosterId} rosterName={opponent.rosterName} /> : <span>Unknown</span>}
                  by
                  {opponent ? <UserLink userName={opponent.userName} /> : null}
                  {pending && <span className="text-muted-foreground italic text-xs">· Pending</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                {isOwner && pending && isA && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Cancel this pending record"
                    onClick={() => handleCancel(m.matchResultId)}
                  >
                    Cancel
                  </button>
                )}
                <div className="text-muted-foreground text-xs text-right">
                  <div>{datePart}</div>
                  <div>{timePart}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
