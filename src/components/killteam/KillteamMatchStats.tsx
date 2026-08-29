'use client'

import { KillteamLink } from '@/components/shared/Links'
import MatchRecord from '@/components/shared/MatchRecord'
import { MATCH_STATS_PERIOD, MatchStatsPeriod, KillteamMatchStats as Stats } from '@/types'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

const periods: { value: MatchStatsPeriod; label: string }[] = [
  { value: MATCH_STATS_PERIOD.ALL, label: 'All time' },
  { value: MATCH_STATS_PERIOD.SIX_MONTHS, label: 'Last 6 months' },
  { value: MATCH_STATS_PERIOD.THREE_MONTHS, label: 'Last 3 months' },
  { value: MATCH_STATS_PERIOD.ONE_MONTH, label: 'Last month' },
]

type SortKey = 'killteamName' | 'wins' | 'losses' | 'draws' | 'games'

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'killteamName', label: 'Opponent', numeric: false },
  { key: 'wins', label: 'W', numeric: true },
  { key: 'losses', label: 'L', numeric: true },
  { key: 'draws', label: 'D', numeric: true },
  { key: 'games', label: 'Games', numeric: true },
]

export default function KillteamMatchStats({ killteamId }: { killteamId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('games')
  const [ascending, setAscending] = useState(false)
  const [period, setPeriod] = useState<MatchStatsPeriod>(MATCH_STATS_PERIOD.ALL)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/killteams/${killteamId}/matchStats?period=${period}`)
        if (!res.ok) throw new Error('Failed to load match stats')
        const data = await res.json()
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setStats(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [killteamId, period])

  const sorted = useMemo(() => {
    if (!stats) return []
    const rows = [...stats.matchups]
    rows.sort((a, b) => {
      const compared = sortKey === 'killteamName'
        ? a.killteamName.localeCompare(b.killteamName)
        : a[sortKey] - b[sortKey]
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

  const hasResults = !!stats && (stats.games > 0 || stats.mirrorGames > 0)
  const winRate = stats && stats.games > 0 ? `${Math.round((stats.wins / stats.games) * 100)}%` : '—'

  // Record left, period filter right - the same header shape as the roster
  // Battles tab. The empty div keeps the filter right-aligned while loading.
  const header = (
    <div className="flex items-center justify-between gap-2 mb-4">
      {hasResults && stats
        ? <MatchRecord wins={stats.wins} losses={stats.losses} draws={stats.draws} winRate={winRate} />
        : <div />}

      <label htmlFor="statsPeriod" className="flex items-center gap-3 w-56">
        Period:
        <select
          id="statsPeriod"
          className="flex-1 min-w-0 bg-card border border-border rounded p-2 text-sm"
          value={period}
          onChange={e => setPeriod(e.target.value as MatchStatsPeriod)}
        >
          {periods.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
    </div>
  )

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        {header}
        <p className="text-muted text-center py-8">Loading…</p>
      </div>
    )
  }

  if (!stats || !hasResults) {
    return (
      <div className="max-w-3xl mx-auto">
        {header}
        <p className="text-muted text-center py-8">No battles have been recorded for this killteam in this period.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {header}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(({ key, label, numeric }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className={clsx(
                  'py-1 cursor-pointer select-none text-main font-bold',
                  numeric ? 'text-right w-12' : 'text-left',
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
              <td className="text-right">{matchup.wins}</td>
              <td className="text-right">{matchup.losses}</td>
              <td className="text-right">{matchup.draws}</td>
              <td className="text-right">{matchup.games}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-sm text-muted mt-4">
        Confirmed results only.
        {stats.mirrorGames > 0 && ` ${stats.mirrorGames} mirror ${stats.mirrorGames === 1 ? 'match is' : 'matches are'} excluded.`}
      </p>
    </div>
  )
}
