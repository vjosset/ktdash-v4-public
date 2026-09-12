'use client'

import { KillteamLink } from '@/components/shared/Links'
import { KillteamBattleRecord, KillteamPlain } from '@/types'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

type SortKey = 'killteamName' | 'winRate' | 'rosterCount'

// Formatted with a fixed locale rather than the viewer's: this renders on the
// server too, and a locale-dependent number would mismatch on hydration
const numberFormatter = new Intl.NumberFormat('en-US')

export default function KillteamStatsTable({
  killteams,
  battlesEnabled,
  battleRecords,
}: {
  killteams: KillteamPlain[]
  battlesEnabled: boolean
  battleRecords: KillteamBattleRecord[]
}) {
  // Null until a column is clicked: the untouched table keeps the order the
  // server delivered, which is the same order the Standard tab renders in
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [ascending, setAscending] = useState(false)

  const recordsByKillteam = useMemo(
    () => new Map(battleRecords.map(record => [record.killteamId, record])),
    [battleRecords],
  )

  /*
    Null, not zero, when a team has never fought: "no rate" and "a rate of 0%"
    are different facts, and collapsing them would rank an unplayed team as the
    worst in the game.
  */
  const rateOf = useMemo(() => (killteam: KillteamPlain) => {
    const record = recordsByKillteam.get(killteam.killteamId)
    return record && record.battles > 0 ? record.wins / record.battles : null
  }, [recordsByKillteam])

  const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: 'killteamName', label: 'Killteam', numeric: false },
    ...(battlesEnabled ? [{ key: 'winRate' as const, label: 'Win%', numeric: true }] : []),
    { key: 'rosterCount', label: 'Rosters', numeric: true },
  ]

  const sorted = useMemo(() => {
    // Replicating the server's faction/seq ordering here would duplicate it and
    // drift the moment it changes, so the default is simply not to reorder
    if (sortKey === null) return killteams

    const rows = [...killteams]

    rows.sort((a, b) => {
      if (sortKey === 'winRate') {
        const rateA = rateOf(a)
        const rateB = rateOf(b)

        // Rateless teams sink to the bottom in both directions - flipping the
        // sort shouldn't promote "never played" to the top of the table
        if (rateA === null || rateB === null) {
          if (rateA === rateB) return a.killteamName.localeCompare(b.killteamName)
          return rateA === null ? 1 : -1
        }

        return (ascending ? rateA - rateB : rateB - rateA) || a.killteamName.localeCompare(b.killteamName)
      }

      const compared = sortKey === 'killteamName'
        ? a.killteamName.localeCompare(b.killteamName)
        : (a.rosterCount ?? 0) - (b.rosterCount ?? 0)

      // Equal counts read better alphabetically than in insertion order
      return (ascending ? compared : -compared) || a.killteamName.localeCompare(b.killteamName)
    })

    return rows
  }, [killteams, sortKey, ascending, rateOf])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setAscending(prev => !prev)
      return
    }
    setSortKey(key)
    // Names start A-Z, numbers start with the biggest
    setAscending(key === 'killteamName')
  }

  if (killteams.length === 0) {
    return <div className="text-center text-muted mt-4">No killteams found.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(({ key, label, numeric }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className={clsx(
                  'px-2 py-2 cursor-pointer select-none text-main font-bold',
                  numeric ? 'text-right' : 'text-left',
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
          {sorted.map(killteam => {
            const rate = rateOf(killteam)
            const record = recordsByKillteam.get(killteam.killteamId)

            return (
              <tr key={killteam.killteamId}>
                <td className="px-2 py-1">
                  <KillteamLink killteam={killteam} />
                </td>
                {battlesEnabled && (
                  // The rate alone hides sample size, so the record is on hover
                  <td
                    className="px-2 py-1 text-right"
                    title={record ? `${record.wins}W · ${record.losses}L · ${record.draws}D` : undefined}
                  >
                    {rate === null ? '—' : `${Math.round(rate * 100)}%`}
                  </td>
                )}
                <td className="px-2 py-1 text-right">
                  {numberFormatter.format(killteam.rosterCount ?? 0)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
