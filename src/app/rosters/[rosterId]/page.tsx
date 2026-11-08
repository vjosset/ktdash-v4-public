import { getAuthSession } from '@/lib/auth'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { getOpPortraitUrl, getRosterPortraitUrl, toEpochMs } from '@/lib/utils/imageUrls'
import { BattleService, RosterService } from '@/services'
import { WeaponRuleService } from '@/services/weaponRule.service'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import RosterPageClient from './RosterPageClient'

// generateMetadata and the page share one load per request
const getRoster = cache((rosterId: string) => RosterService.getRoster(rosterId))

export async function generateMetadata({ params, searchParams }:
  { params: Promise<{ rosterId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const { rosterId } = await params
  const sp = await searchParams
  const roster = await getRoster(rosterId)

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

export default async function RosterPage({ params, searchParams }:
  { params: Promise<{ rosterId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { rosterId } = await params
  const { tab } = await searchParams
  const [roster, allWeaponRules] = await Promise.all([
    getRoster(rosterId),
    WeaponRuleService.getAllWeaponRules(),
  ])

  if (!roster) notFound()

  const session = await getAuthSession()
  const isOwner = session?.user?.userId === roster.userId

  if (!isOwner) {
    RosterService.incrementRosterViewCount(rosterId)
  }

  // Seeds the Battles tab badge; the tab itself only loads battles when opened
  const battlesEnabled = process.env.NEXT_PUBLIC_ENABLE_BATTLES === 'true'
  const pendingBattleCount = isOwner && battlesEnabled
    ? await BattleService.countAwaitingRoster(rosterId)
    : 0

  return (
    <div className="mx-auto">
      <RosterPageClient
        initialRoster={roster.toPlain()}
        isOwner={isOwner}
        allWeaponRules={allWeaponRules.map((rule) => rule.toPlain())}
        initialTab={typeof tab === 'string' ? tab : undefined}
        initialPendingBattleCount={pendingBattleCount}
      />
    </div>
  )
}
