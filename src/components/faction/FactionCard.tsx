import { Faction } from '@/types/faction.model'
import Link from 'next/link'

type FactionCardProps = {
  faction: Faction
}

export default function FactionCard({ faction }: FactionCardProps) {
  return (
    <Link 
      className="group grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] bg-card border border-border rounded overflow-hidden hover:border-main transition h-[120px]"
      href={`/factions/${faction.factionId}`}
    >
      {/* Image section - left side */}
      <div className="relative">
        <div 
          className="absolute inset-0 border-r border-border bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url(/img/factions/${faction.factionId}.jpg)` }}
        />
      </div>

      {/* Content section - right side */}
      <div className="relative px-3 py-2 flex flex-col justify-between">
        <div className="flex items-center gap-x-2">
          <h4 className="font-heading text-main text-xl">{faction.factionName}</h4>
        </div>
        <p className="line-clamp-3">
          {faction.description}
        </p>
      </div>
    </Link>
  )
}
