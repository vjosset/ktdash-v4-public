import KillteamCard from '@/components/killteam/KillteamCard'
import PageTitle from '@/components/ui/PageTitle'
import { GAME } from '@/lib/config/game_config'
import { KillteamService } from '@/services'

export const metadata = {
  title: `Killteams - ${GAME.NAME}`,
  description: `Browse all factions in ${GAME.NAME} and choose your roster’s allegiance.`,
}

export default async function KillteamsPage() {
  const killteams = await KillteamService.getAllKillteams()

  return (
    <div className="px-1 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <PageTitle>Killteams</PageTitle>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {killteams.map((killteam) => (
          <KillteamCard key={killteam.killteamId} killteam={killteam} />
        ))}
      </div>
    </div>
  )
}
