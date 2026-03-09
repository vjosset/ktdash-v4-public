'use client'

import { RosterLink, UserLink } from '@/components/shared/Links'
import { Button, Modal } from '@/components/ui'
import { MatchResultPlain } from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { toast } from 'sonner'

type RosterSearchResult = {
  rosterId: string
  rosterName: string
  userId: string
  userName: string
  killteamName: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function getWLD(history: MatchResultPlain[], rosterId: string) {
  let wins = 0, losses = 0, draws = 0
  for (const m of history) {
    if (!m.rosterBConfirmed) continue
    if (m.result === 'D') { draws++; continue }
    const iA = m.rosterAId === rosterId
    if ((iA && m.result === 'A') || (!iA && m.result === 'B')) wins++
    else losses++
  }
  return { wins, losses, draws }
}

function resultLabel(match: MatchResultPlain, rosterId: string): { letter: string; cls: string; pending: boolean } {
  const iA = match.rosterAId === rosterId
  const pending = !match.rosterBConfirmed
  if (match.result === 'D') return { letter: 'D', cls: 'text-muted-foreground', pending }
  const win = (iA && match.result === 'A') || (!iA && match.result === 'B')
  return win
    ? { letter: 'W', cls: 'text-main', pending }
    : { letter: 'L', cls: 'text-muted-foreground', pending }
}

function RecordBattleModal({
  rosterId,
  rosterName,
  userId,
  onClose,
  onRecorded,
}: {
  rosterId: string
  rosterName: string
  userId: string
  onClose: () => void
  onRecorded: (result: MatchResultPlain) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RosterSearchResult[]>([])
  const [selected, setSelected] = useState<RosterSearchResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return }
    fetch(`/api/rosters/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((rows: RosterSearchResult[]) =>
        setResults(rows.filter(r => r.rosterId !== rosterId && r.userId !== userId))
      )
      .catch(() => setResults([]))
  }, [debouncedQuery, rosterId, userId])

  const submit = async (result: 'A' | 'B' | 'D') => {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/match-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterAId: rosterId, rosterBId: selected.rosterId, result }),
      })
      if (!res.ok) throw new Error(await res.text())
      const created: MatchResultPlain = await res.json()
      toast.success('Battle recorded — awaiting opponent confirmation')
      onRecorded(created)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record battle')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Record Battle"
      onClose={onClose}
      footer={null}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Find opponent roster</label>
          <input
            ref={inputRef}
            className="w-full border border-border rounded px-3 py-2 bg-background text-foreground text-sm"
            placeholder="Search by roster name or username…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
          />
        </div>

        {results.length > 0 && !selected && (
          <ul className="border border-border rounded divide-y divide-border max-h-48 overflow-y-auto">
            {results.map(r => (
              <li
                key={r.rosterId}
                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                onClick={() => { setSelected(r); setResults([]) }}
              >
                <span className="font-medium">{r.rosterName}</span>
                <span className="text-muted-foreground ml-2">by {r.userName}</span>
                {r.killteamName && <span className="text-muted-foreground ml-1">({r.killteamName})</span>}
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div className="border border-border rounded px-3 py-2 text-sm flex items-center justify-between">
            <span>
              <span className="font-medium">{selected.rosterName}</span>
              <span className="text-muted-foreground ml-2">by {selected.userName}</span>
            </span>
            <button className="text-muted-foreground hover:text-foreground text-xs ml-2" onClick={() => setSelected(null)}>
              Change
            </button>
          </div>
        )}

        {selected && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{rosterName}</strong> vs <strong>{selected.rosterName}</strong> — who won?
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => submit('A')} disabled={submitting}>
                I Won
              </Button>
              <Button className="flex-1" variant="ghost" onClick={() => submit('D')} disabled={submitting}>
                Draw
              </Button>
              <Button className="flex-1" variant="ghost" onClick={() => submit('B')} disabled={submitting}>
                They Won
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function BattlesTab({
  rosterId,
  rosterName,
  isOwner,
  userId,
}: {
  rosterId: string
  rosterName: string
  isOwner: boolean
  userId: string
}) {
  const [history, setHistory] = useState<MatchResultPlain[]>([])
  const [pending, setPending] = useState<MatchResultPlain[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const historyRes = await fetch(`/api/match-results/history/${rosterId}`)
      if (historyRes.ok) setHistory(await historyRes.json())

      if (isOwner) {
        const pendingRes = await fetch('/api/match-results/pending')
        if (pendingRes.ok) {
          const all: MatchResultPlain[] = await pendingRes.json()
          setPending(all.filter(m => m.rosterBId === rosterId))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [rosterId, isOwner])

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

  const handleRecorded = (result: MatchResultPlain) => {
    setHistory(prev => [result, ...prev])
  }

  const { wins, losses, draws } = getWLD(history, rosterId)

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
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1"
            title="Refresh"
          >
            <FiRefreshCw size={14} />
          </button>
          {isOwner && (
            <Button onClick={() => setShowModal(true)}>
              Record Battle
            </Button>
          )}
        </div>
      </div>

      {/* Pending confirmations (for rosterB owner) */}
      {isOwner && pending.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-semibold">Awaiting Your Confirmation</h5>
          {pending.map(m => {
            const opponent = m.rosterA
            const theyRecorded = m.result === 'B' ? 'They recorded: I Won' : m.result === 'A' ? 'They recorded: You Won' : 'They recorded: Draw'
            return (
              <div key={m.matchResultId} className="border border-border rounded px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm">
                  <span className="font-medium">{opponent?.rosterName ?? 'Unknown'}</span>
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
          const { letter, cls, pending } = resultLabel(m, rosterId)
          const isA = m.rosterAId === rosterId
          const opponent = isA ? m.rosterB : m.rosterA
          const d = new Date(m.matchDate)
          const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          const timePart = d.toLocaleTimeString(undefined, { timeStyle: 'short' })
          return (
            <div key={m.matchResultId} className="flex items-center justify-between border-b border-border pb-2 text-sm">
              <div className="flex items-center gap-3">
                <span className={`font-bold w-5 text-center ${cls}`}>{letter}</span>
                <span className="flex items-center flex-wrap gap-1">
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

      {showModal && (
        <RecordBattleModal
          rosterId={rosterId}
          rosterName={rosterName}
          userId={userId}
          onClose={() => setShowModal(false)}
          onRecorded={handleRecorded}
        />
      )}
    </div>
  )
}
