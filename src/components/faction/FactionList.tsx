import { FactionService } from '@/services'
import { Faction } from '@/types'
import Link from 'next/link'
import { KillteamLink } from '../shared/Links'

type FactionListProps = {
  factions?: Faction[] | null
}

export default async function FactionList({
  factions = null
}: FactionListProps) {
  if (!factions || factions.length == 0) {
    factions = await FactionService.getAllFactions()
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {factions.map((faction) => (
        <div key={faction.factionId}>
          <Link href={`/factions/${faction.factionId}`}>
            <h4 className="font-heading">{faction.factionName}</h4>
          </Link>
            
          <div className="flex flex-col gap-2">
            {faction.killteams.map((killteam) => {
              //return <KillteamCard key={killteam.killteamId} killteam={killteam} />
              return <KillteamLink key={killteam.killteamId} killteamId={killteam.killteamId} killteamName={killteam.killteamName} />
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
