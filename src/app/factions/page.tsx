import FactionList from '@/components/faction/FactionList'
import PageTitle from '@/components/ui/PageTitle'
import { GAME } from '@/lib/config/game_config'

export const metadata = {
  title: `Factions - ${GAME.NAME}`,
  description: `Browse all factions in ${GAME.NAME} and choose your roster's allegiance.`,
}

export default async function FactionsPage() {
  return (
    <div className="px-1 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <PageTitle>Factions</PageTitle>
      </div>

      <FactionList />
    </div>
  )
}
