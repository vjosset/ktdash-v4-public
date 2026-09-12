import KillteamCard from '@/components/killteam/KillteamCard'
import { KillteamBattleRecord, KillteamPlain } from '@/types'
import clsx from 'clsx'
import Link from 'next/link'
import HomebrewKillteamsSection from './HomebrewKillteamsSection'
import KillteamStatsTable from './KillteamStatsTable'

type Tab = 'standard' | 'homebrew' | 'stats'

interface KillteamsPageClientProps {
  killteams: KillteamPlain[]
  tab: Tab
  battlesEnabled: boolean
  battleRecords: KillteamBattleRecord[]
}

const tabOptions: { key: Tab; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'homebrew', label: 'Homebrew' },
  { key: 'stats', label: 'Stats' },
]

const tabHref = (tab: Tab) => (tab === 'standard' ? '/killteams' : `/killteams?tab=${tab}`)

export default function KillteamsPageClient({
  killteams,
  tab,
  battlesEnabled,
  battleRecords,
}: KillteamsPageClientProps) {
  const standardKillteams = killteams.filter((killteam) => !killteam.isHomebrew)
  const homebrewKillteams = killteams.filter((killteam) => killteam.isHomebrew)

  // Homebrew teams are excluded: too few rosters and too much churn for the
  // numbers to mean anything next to the standard teams
  const statsRows = killteams.filter((killteam) => killteam.isPublished && !killteam.isHomebrew)

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-2 py-2 border-b-2 transition-colors',
      selected ? 'border-main text-main' : 'border-transparent text-muted hover:text-foreground'
    )

  return (
    <div>
      <div className="overflow-x-auto px-2 noprint">
        <div className="flex justify-center space-x-2 border-b border-border mb-4 min-w-max">
          {tabOptions.map(({ key, label }) => (
            <Link
              key={key}
              href={tabHref(key)}
              replace
              scroll={false}
              className={tabClasses(tab === key)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {tab === 'standard' && (
        <div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {standardKillteams.map((killteam) => (
              <KillteamCard key={killteam.killteamId} killteam={killteam} />
            ))}
          </div>
          {standardKillteams.length === 0 && (
            <div className="text-center text-muted mt-4">No standard killteams available.</div>
          )}
        </div>
      )}

      {tab === 'homebrew' && (
        <HomebrewKillteamsSection killteams={homebrewKillteams} />
      )}

      {tab === 'stats' && (
        <KillteamStatsTable
          killteams={statsRows}
          battlesEnabled={battlesEnabled}
          battleRecords={battleRecords}
        />
      )}
    </div>
  )
}
