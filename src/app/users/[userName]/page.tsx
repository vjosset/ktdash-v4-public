import PageTitle from '@/components/ui/PageTitle'
import { GAME } from '@/lib/config/game_config'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { getRosterPortraitUrl } from '@/lib/utils/imageUrls'
import { UserService } from '@/services'
import { MatchResultService } from '@/services/matchResult.service'
import { getAuthSession } from '@/src/lib/auth'
import { notFound } from 'next/navigation'
import UserPageClient from './UserPageClient'
export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params
  const session = await getAuthSession()
  const user = await UserService.getUserByUsername(userName, { viewerUserId: session?.user?.userId })

  if (!user) {
    return {
      title: 'User Not Found',
    }
  }

  const imageUrls = user.rosters?.
    filter((r) => r.hasCustomPortrait).
    map((r) => getRosterPortraitUrl(r.rosterId)).
    slice(0, 5)
  
  if (!imageUrls || imageUrls.length < 1) {
    const firstRoster = user.rosters?.[0]
    const kt = firstRoster?.killteam
    if (kt?.killteamId) {
      const fallback = (kt.isHomebrew || kt.factionId === 'HBR')
        ? `/api/killteams/${kt.killteamId}/portrait`
        : `/img/killteams/${kt.killteamId}.webp`
      imageUrls?.push(fallback)
    }
  }

  return generatePageMetadata({
    title: `${user.userName}'s KillTeam Rosters`,
    description: `View and import ${user.userName}'s KillTeam rosters on ${GAME.NAME}.`,
    keywords: [user.userName, 'user', 'roster'],
    images: imageUrls?.map((img) => {
      return { url: img}
    }),
    pagePath: `/users/${user.userName}`
  })
}

export default async function UserPage({ params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params

  const session = await getAuthSession()

  const user = await UserService.getUserByUsername(userName, { viewerUserId: session?.user?.userId })

  if (!user) return notFound()

  const isOwner = session?.user?.userId === user.userId

  const battlesEnabled = process.env.NEXT_PUBLIC_FEATURE_BATTLES === 'true'
  // Owners see the tab if they have any battle (confirmed or pending); others only if confirmed exist
  const hasMatchResults = battlesEnabled
    ? await MatchResultService.hasMatchResultsForUser(user.userId, !isOwner)
    : false

  return (
    <div className="px-1 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <PageTitle>
          {user.userName}
        </PageTitle>
      </div>

      <UserPageClient
        user={user.toPlain()}
        isOwner={isOwner}
        userName={user.userName}
        hasMatchResults={hasMatchResults}
      />
    </div>
  )
}
