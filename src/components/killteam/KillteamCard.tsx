import { Killteam } from '@/types/killteam.model'
import Link from 'next/link'
import Markdown from '../ui/Markdown'

type KillteamCardProps = {
  killteam: Killteam
}

export default function KillteamCard({ killteam }: KillteamCardProps) {
  return (
    <Link 
      className="group grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] bg-card border border-border rounded overflow-hidden hover:border-main transition h-[120px]"
      href={`/killteams/${killteam.killteamId}`}
    >
      {/* Image section - left side */}
      <div className="relative">
        <div 
          className="absolute inset-0 border-r border-border bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url(/img/killteams/${killteam.killteamId}.jpg)` }}
        />
      </div>

      {/* Content section - right side */}
      <div className="relative px-3 py-2 flex flex-col justify-between">
        <div className="flex items-center gap-x-2">
          <h4 className="font-heading text-main text-xl">{killteam.killteamName}</h4>
        </div>
        <Markdown className="line-clamp-3">
          {killteam.description}
        </Markdown>
      </div>
    </Link>
  )
}
