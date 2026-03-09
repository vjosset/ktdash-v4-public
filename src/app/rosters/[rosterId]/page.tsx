import { getAuthSession } from '@/lib/auth'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { getOpPortraitUrl, getRosterPortraitUrl, toEpochMs } from '@/lib/utils/imageUrls'
import { RosterService } from '@/services'
import { MatchResultService } from '@/services/matchResult.service'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import RosterPageClient from './RosterPageClient'

export async function generateMetadata({ params, searchParams }:
  { params: Promise<{ rosterId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const { rosterId } = await params
  const sp = await searchParams
  const roster = await RosterService.getRoster(rosterId)

  if (!roster) {
    return {
      title: 'Roster Not Found',
    }
  }
  
  const images: string[] = [];
  if (roster.hasCustomPortrait) {
    images.push(getRosterPortraitUrl(roster.rosterId))
  }
  roster.ops?.
    filter(op => op.hasCustomPortrait).
    map(op => op.hasCustomPortrait && images.push(`${getOpPortraitUrl(op.opId)}?v=${toEpochMs(op.portraitUpdatedAt)}`)).
    slice(0, 5)

  // Determine canonical path: baseline vs gallery
  const isGallery = (sp?.tab === 'gallery') || (Array.isArray(sp?.tab) && sp.tab.includes('gallery')) || sp.gallery == '1'

  // Fallback killteam portrait: API for homebrew, static for official
  const fallbackKillteamImg = roster.killteam?.factionId === 'HBR'
    ? `/api/killteams/${roster.killteam?.killteamId}/portrait`
    : `/img/killteams/${roster.killteam?.killteamId}.webp`

  return generatePageMetadata({
    title: `${roster.rosterName} by ${roster.user?.userName}${isGallery ? ' - Gallery' : ''}`,
    description: roster.description || `${roster.killteam?.killteamName} Roster for KillTeam`,
    images: 
      images.length > 0
      ? images.map((img) => ({url: img}))
      : [{ url: fallbackKillteamImg }],
    keywords: [roster.rosterName, roster.killteam?.killteamName ?? '', isGallery ? 'photo gallery' : '', 'roster', 'roster builder', 'battle tracker'],
    pagePath: `/rosters/${roster.rosterId}${isGallery ? '/gallery' : ''}`
  })
}

export default async function RosterPage({ params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params
  const roster = (await RosterService.getRoster(rosterId))

  if (!roster) notFound()

  const session = await getAuthSession()
  const isOwner = session?.user?.userId === roster.userId

  if (!isOwner) {
    RosterService.incrementRosterViewCount(rosterId)
  }

  const battlesEnabled = process.env.NEXT_PUBLIC_FEATURE_BATTLES === 'true'
  const hasMatchResults = battlesEnabled && !isOwner
    ? await MatchResultService.hasConfirmedMatchResults(rosterId)
    : false

  return (
    <div className="mx-auto">
      <RosterPageClient initialRoster={roster.toPlain()} isOwner={isOwner} hasMatchResults={hasMatchResults} />
    </div>
  )
}
