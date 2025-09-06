import { UserLink } from '@/components/shared/Links'
import Markdown from '@/components/ui/Markdown'
import PageTitle from '@/components/ui/PageTitle'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { KillteamService } from '@/services'
import { WeaponRuleService } from '@/services/weaponRule.service'
import { notFound } from 'next/navigation'
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
      url: `/img/killteams/${killteamId}.webp`,
    }],
    keywords: ['home', 'roster builder', 'battle tracker', 'killteam', killteam.killteamId, killteam.killteamName],
    pagePath: `/killteams/${killteam.killteamId}`
  })
}

export default async function KillteamPage({ params }: { params: Promise<{ killteamId: string }> }) {
  const { killteamId } = await params
  const killteam = await KillteamService.getKillteam(killteamId)

  if (!killteam) notFound()
    
  const allWeaponRules = await WeaponRuleService.getAllWeaponRules()

  return (
    <div className="max-w-full">
      
      {/* Full-width killteam header */}
      <div className="relative w-full min-h-[150px] md:min-h-[150px] print:md:min-h-[0px] noprint">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{
            backgroundImage: `url(/img/killteams/${killteam.killteamId}.webp)`
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/80 to-background" />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col items-center justify-end text-center h-full pt-28 md:pt-20 pb-6 px-4 print:pt-1 print:pb-1">
          <div className="cursor-pointer flex items-center gap-2">
            <PageTitle>
              {killteam.killteamName}
            </PageTitle>
          </div>

          {/* Meta info below title */}
          <div className="flex items-center flex-wrap justify-center gap-2 text-muted-foreground text-sm mt-2">
            {killteam.isHomebrew && (
              <div className="min-w-0 text-sm text-muted">
                Homebrew
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
      <div className="px-1 py-8 max-w-7xl mx-auto">
        <KillteamPageClient killteam={killteam.toPlain()} />
      </div>
    </div>
  )
}
