'use client'

import { getOpPortraitUrl, getRosterPortraitUrl, toEpochMs } from '@/lib/utils/imageUrls'
import { KillteamPlain, RosterPlain, SpotlightRosterPlain } from '@/types'
import Link from 'next/link'
import { useState } from 'react'
import { KillteamLink, UserLink } from '../shared/Links'

type RosterSpotlightCardProps = {
  roster: SpotlightRosterPlain & Pick<RosterPlain, 'ops'> & {
    killteam?: Pick<KillteamPlain, 'killteamId' | 'killteamName' | 'isHomebrew' | 'userId'> | null
  }
  showUserLink?: boolean
  showKillteamLink?: boolean
}

export default function RosterSpotlightCard({
  roster,
  showUserLink = true,
  showKillteamLink = true
}: RosterSpotlightCardProps) {
  const heroUrl = roster.hasCustomPortrait
    ? `${getRosterPortraitUrl(roster.rosterId)}?v=${toEpochMs(roster.portraitUpdatedAt)}`
    : (roster.killteam?.isHomebrew && roster.killteam?.userId
      ? `/api/killteams/${roster.killteamId}/portrait?thumb=1`
      : `/img/killteams/${roster.killteamId}_thumb.webp`)

  const [activeOpId, setActiveOpId] = useState<string | null>(null)

  const displayUrl = activeOpId
    ? `${getOpPortraitUrl(activeOpId)}?v=${toEpochMs(roster.ops?.find(o => o.opId === activeOpId)?.portraitUpdatedAt)}`
    : heroUrl

  function handleOpClick(opId: string) {
    setActiveOpId(prev => prev === opId ? null : opId)
  }

  return (
    <div className="group relative border border-border rounded overflow-hidden hover:border-main transition-colors duration-200">

      {/* Hero portrait */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 2' }}>
        {/* Image + gradient — full-area link */}
        <Link href={`/rosters/${roster.rosterId}`} className="absolute inset-0 z-0">
          <img
            src={displayUrl}
            loading="lazy"
            decoding="async"
            alt={`${roster.rosterName} roster portrait`}
            className="w-full h-full object-cover brightness-[0.85] group-hover:brightness-95 group-hover:scale-[1.02] transition-all duration-400"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.7) 75%, rgba(0,0,0,1) 100%)' }}
          />
        </Link>
        {/* Text overlay — sibling of the link, so nested <a> tags are avoided */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2 z-10">
          <Link href={`/rosters/${roster.rosterId}`}>
            <h3 className="font-title text-white text-2xl uppercase tracking-wide leading-none mb-2 hover:text-main transition-colors" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {roster.rosterName}
            </h3>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {showKillteamLink && roster.killteam?.killteamName && (
              <KillteamLink killteam={roster.killteam} />
            )}
            by
            {showUserLink && roster.user?.userName && (
              <UserLink userName={roster.user.userName} />
            )}
          </div>
        </div>
      </div>

      {/* Op strip */}
      {roster.ops && roster.ops.filter((op) => op.hasCustomPortrait).length > 0 && (
        <div className="bg-card border-t border-border px-3 py-2 flex gap-1 items-center overflow-x-auto">
          {/* Roster portrait thumbnail — resets hero to roster view */}
          <button
            type="button"
            title={roster.rosterName}
            onClick={() => setActiveOpId(null)}
            className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 border transition-all duration-200 relative hover:scale-110 hover:z-10 mr-1 ${
              activeOpId === null
                ? 'border-main scale-110 z-10 brightness-100'
                : 'border-border brightness-[0.8] hover:brightness-100 hover:border-main'
            }`}
          >
            <img src={heroUrl} alt={roster.rosterName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          </button>
          {roster.ops.filter((op) => op.hasCustomPortrait).map(op => (
            <button
              key={op.opId}
              type="button"
              title={op.opName}
              onClick={() => handleOpClick(op.opId)}
              className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 border transition-all duration-200 relative hover:scale-110 hover:z-10 ${
                activeOpId === op.opId
                  ? 'border-main scale-110 z-10 brightness-100'
                  : 'border-border brightness-[0.8] hover:brightness-100 hover:border-main'
              }`}
            >
              <img
                src={`${getOpPortraitUrl(op.opId)}?v=${toEpochMs(op.portraitUpdatedAt)}`}
                alt={op.opName}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
