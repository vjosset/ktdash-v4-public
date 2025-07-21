import { getAuthSession } from '@/lib/auth'
import { GAME } from '@/lib/config/game_config'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { RosterService } from '@/services'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import RosterPageClient from './RosterPageClient'

export async function generateMetadata({ params }: { params: Promise<{ rosterId: string }> }): Promise<Metadata> {
  const { rosterId } = await params
  const roster = await RosterService.getRoster(rosterId)

  if (!roster) {
    return {
      title: 'Roster Not Found',
    }
  }

  return generatePageMetadata({
    title: `${roster.rosterName} by ${roster.user?.userName}`,
    description: `A ${roster.killteam?.killteamName} Roster for ${GAME.NAME}`,
    image: {
      url: `/img/killteams/${roster.killteam?.killteamId}.jpg`,
    },
    keywords: [roster.rosterName, roster.killteam?.killteamName ?? '', 'roster', 'roster builder', 'battle tracker'],
    pagePath: `/rosters/${roster.rosterId}`
  })
}

export default async function RosterPage({ params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params
  const roster = (await RosterService.getRoster(rosterId))

  if (!roster) notFound()

  const session = await getAuthSession()
  const isOwner = session?.user?.userId === roster.userId

  return (
    <div className="px-1 py-8 max-w-7xl mx-auto">
      <RosterPageClient initialRoster={roster.toPlain()} isOwner={isOwner} />
    </div>
  )
}
