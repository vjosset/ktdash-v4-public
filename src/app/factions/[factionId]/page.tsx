import KillteamCard from '@/components/killteam/KillteamCard'
import Markdown from '@/components/ui/Markdown'
import PageTitle from '@/components/ui/PageTitle'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { FactionService } from '@/src/services'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ factionId: string }>  }) {
  const { factionId } = await params
  const faction = await FactionService.getFaction(factionId)
  
  if (!faction) return {}

  return generatePageMetadata({
    title: `${faction.factionName}`,
    description: `${faction.description}`,
    image: {
      url: `/img/factions/${factionId}.jpg`,
    },
    keywords: ['home', 'roster builder', 'battle tracker', 'faction', faction.factionId, faction.factionName],
    pagePath: `/factions/${faction.factionId}`
  })
}

export default async function FactionPage({ params }: { params: Promise<{ factionId: string }> }) {
  const { factionId } = await params
  const faction = await FactionService.getFaction(factionId)

  if (!faction) notFound()

  return (
    <div>
      <div className="relative min-h-[300px] md:h-[400px] flex items-center justify-center py-12">
        <div 
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: `url(/img/factions/${faction.factionId}.jpg)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        </div>
        <div className="relative flex flex-col items-center justify-center px-8 pt-48 w-full">
          <div className="flex items-center gap-x-4 mb-4">
            <PageTitle>{faction.factionName}</PageTitle>
          </div>
          <div className="text-white max-w-2xl text-center">
            <Markdown>{faction.description}</Markdown>
          </div>
        </div>
      </div>
      <div className="px-1 py-8 max-w-7xl mx-auto">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {faction.killteams.map((killteam) => {
            return <KillteamCard key={killteam.killteamId} killteam={killteam} />
          })}
        </div>
      </div>
    </div>
  )
}
  