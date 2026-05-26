import { UserLink } from '@/components/shared/Links'
import Markdown from '@/components/ui/Markdown'
import PageTitle from '@/components/ui/PageTitle'
import { authOptions } from '@/lib/auth'
import { GAME } from '@/lib/config/game_config'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { KillteamService } from '@/src/services'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import KillteamPageClient from './KillteamPageClient'

export async function generateMetadata({ params }: { params: Promise<{ killteamId: string }>  }) {
  const { killteamId } = await params
  const killteam = await KillteamService.getKillteam(killteamId)
  
  if (!killteam) return {}

  const description =
    (killteam.isHomebrew ? `Homebrew by ${killteam.user?.userName ?? 'Unknown'} - ` : '')
    + killteam.description

  return generatePageMetadata({
    title: `${killteam.killteamName}`,
    description: `${description}`,
    images: [{
      url: killteam.isHomebrew && killteam.userId ? `/api/killteams/${killteamId}/portrait` : `/img/killteams/${killteamId}.webp`,
    }],
    keywords: ['home', 'roster builder', 'battle tracker', 'killteam', killteam.killteamId, killteam.killteamName, killteam.isHomebrew ? 'homebrew' : ''],
    pagePath: `/killteams/${killteam.killteamId}`
  })
}

export default async function KillteamPage({ params }: { params: Promise<{ killteamId: string }> }) {
  const { killteamId } = await params
  const session = await getServerSession(authOptions)
  const killteam = await KillteamService.getKillteam(killteamId, { userId: session?.user?.userId })

  if (!killteam) notFound()

  return (
    <div className="max-w-full">
      
      {/* Full-width killteam header */}
      <div className="relative w-full min-h-[150px] md:min-h-[150px] print:md:min-h-[0px]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{
            backgroundImage: killteam.isHomebrew && killteam.userId
              ? `url(/api/killteams/${killteam.killteamId}/portrait)`
              : `url(/img/killteams/${killteam.killteamId}.webp)`
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/80 to-background" />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col items-center justify-end text-center h-full pt-28 md:pt-20 pb-6 px-4 print:pt-1 print:pb-1">
          <div className="cursor-pointer flex items-center gap-2 mb-12">
            <PageTitle>
              {killteam.killteamName}
            </PageTitle>
          </div>

          {/* Meta info below title */}
          <div className="flex items-center flex-wrap justify-center gap-2 text-muted-foreground text-sm mt-2">
            {killteam.isHomebrew && (
              <div className="min-w-0 text-sm text-muted">
                Homebrew {killteam.isHomebrew && !killteam.isPublished && (' (Unpublished)')}
                {killteam.user && (
                  <> by <UserLink userName={killteam.user.userName ?? 'Unknown'} /></>
                )}
              </div>
            )}
          </div>

          {/* Description below meta */}
          {killteam.description && (
            <div className="mt-4 max-w-3xl text-sm text-muted-foreground max-h-[150px] overflow-y-auto noprint">
              <Markdown>{killteam.description}</Markdown>
            </div>
          )}
        </div>
      </div>

      <div className="printonly">
        <QRCodeSVG value={`${GAME.ROOT_URL}/killteams/${killteam.killteamId}`} size={100} />
        <Link href={`/killteams/${killteam.killteamId}`}>{GAME.ROOT_URL}/killteams/{killteam.killteamId}</Link>
      </div>

      <div className="px-1 py-8 max-w-7xl mx-auto">
        <KillteamPageClient killteam={killteam.toPlain()} />
      </div>
    </div>
  )
}
  
