import KillteamsPageContent from '@/app/killteams/KillteamsPageClient'
import PageTitle from '@/components/ui/PageTitle'
import { authOptions } from '@/lib/auth'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { BattleService, KillteamService } from '@/services'
import { getServerSession } from 'next-auth'

type TabOption = 'standard' | 'homebrew' | 'stats'

const validTabs: TabOption[] = ['standard', 'homebrew', 'stats']

const parseTab = (tabParam: unknown): TabOption => {
  const tab = Array.isArray(tabParam) ? tabParam[0] : tabParam
  return validTabs.includes(tab as TabOption) ? (tab as TabOption) : 'standard'
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ tab?: string }> }
) {
  const sp = await searchParams
  const tab = parseTab(sp?.tab)

  // Keep metadata light: use standard killteams for hero images
  const killteams = await KillteamService.getAllKillteams('standard')

  if (!killteams || killteams.length === 0) return {}

  const images = killteams
    .slice(0, 5)
    .map((kt) => ({
      url: kt.isHomebrew && kt.userId
        ? `/api/killteams/${kt.killteamId}/portrait`
        : `/img/killteams/${kt.killteamId}.webp`,
      alt: `${kt.killteamName}`,
    }))

  const title = tab === 'standard' ? 'Killteams' :
    tab === 'homebrew' ? 'Homebrew Killteams' : 'Killteam Stats'

  return generatePageMetadata({
    title: title,
    description: `Browse all killteams, operatives, ploys, equipment, tacops, and painted minis.`,
    images,
    keywords: ['home', 'roster builder', 'battle tracker', 'killteam', 'killteams', 'operatives', 'datacards'],
    pagePath: `/killteams${tab !== 'standard' ? `?tab=${tab}` : ''}`
  })
}

export default async function KillteamsPage(
  { searchParams }: { searchParams: Promise<{ tab?: string }> }
) {
  const sp = await searchParams
  const tab = parseTab(sp?.tab)
  const session = await getServerSession(authOptions)

  const scope = tab === 'homebrew' ? 'homebrew' : tab === 'standard' ? 'standard' : 'all'
  const killteams = await KillteamService.getAllKillteams(scope, { userId: session?.user?.userId })

  // Only queried for the tab that shows it - the page re-renders per tab anyway
  const battlesEnabled = process.env.NEXT_PUBLIC_ENABLE_BATTLES === 'true'
  const battleRecords = battlesEnabled && tab === 'stats'
    ? await BattleService.getAllKillteamBattleRecords()
    : []

  return (
    <div className="px-1 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <PageTitle>Killteams</PageTitle>
      </div>
      <KillteamsPageContent
        tab={tab}
        killteams={killteams.map((killteam) => killteam.toPlain())}
        battlesEnabled={battlesEnabled}
        battleRecords={battleRecords}
      />
    </div>
  )
}
