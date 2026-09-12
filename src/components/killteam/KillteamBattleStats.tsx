'use client'

import { KillteamLink } from '@/components/shared/Links'
import { KillteamBattleStats as Stats, KillteamMatchup } from '@/types'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

type SortKey = 'killteamName' | 'winRate'

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'killteamName', label: 'Opponent', numeric: false },
  { key: 'winRate', label: 'Win%', numeric: true },
]

/*
  Win rate as a fraction, for sorting. Draws sit in the denominator, matching the
  headline rate above and the killteams index, so the three never disagree.
*/
function winRateOf(matchup: KillteamMatchup) {
  return matchup.battles > 0 ? matchup.wins / matchup.battles : 0
}

function formatWinRate(matchup: KillteamMatchup) {
  return matchup.battles > 0 ? `${Math.round(winRateOf(matchup) * 100)}%` : '—'
}

export default function KillteamBattleStats({ killteamId }: { killteamId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('winRate')
  const [ascending, setAscending] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/killteams/${killteamId}/battleStats`)
        if (!res.ok) throw new Error('Failed to load battle stats')
        const data = await res.json()
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setStats(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [killteamId])

  const sorted = useMemo(() => {
    if (!stats) return []
    const rows = [...stats.matchups]
    rows.sort((a, b) => {
      const compared = sortKey === 'killteamName'
        ? a.killteamName.localeCompare(b.killteamName)
        : winRateOf(a) - winRateOf(b)
      // Equal counts read better alphabetically than in insertion order
      return (ascending ? compared : -compared) || a.killteamName.localeCompare(b.killteamName)
    })
    return rows
  }, [stats, sortKey, ascending])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setAscending(prev => !prev)
      return
    }
    setSortKey(key)
    // Names start A-Z, counts start with the biggest
    setAscending(key === 'killteamName')
  }

  if (!stats && !loading) return null

  // Battles only - a killteam whose every battle was a mirror has nothing to show
  // in the table below, and no longer has a note explaining the gap
  const hasResults = !!stats && stats.battles > 0
  const winRate = stats && stats.battles > 0 ? `${Math.round((stats.wins / stats.battles) * 100)}%` : '—'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-muted text-center py-8">Loading…</p>
      </div>
    )
  }

  if (!stats || !hasResults) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-muted text-center py-8">No battles have been recorded for this killteam yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Win rate only - the W/L/D breakdown lives in the per-opponent rows below.
          Styled to match the shared BattleRecord so the two read the same way. */}
      <div className="mb-4 flex gap-4">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-main uppercase tracking-wide leading-none">Win%</span>
          <span className="text-lg font-bold leading-tight">{winRate}</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(({ key, label, numeric }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className={clsx(
                  'py-1 cursor-pointer select-none text-main font-bold',
                  numeric ? 'text-right w-20' : 'text-left',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  {sortKey === key && (ascending ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(matchup => (
            <tr key={matchup.killteamId} className="border-b border-border">
              <td className="py-1">
                <KillteamLink killteam={{ killteamId: matchup.killteamId, killteamName: matchup.killteamName }} />
              </td>
              {/* The rate alone hides sample size, so the record is on hover */}
              <td className="text-right" title={`${matchup.wins}W · ${matchup.losses}L · ${matchup.draws}D`}>
                {formatWinRate(matchup)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
