'use client'

import Link from 'next/link'
import { FiBook, FiList, FiTrash2, FiUser, FiUsers } from 'react-icons/fi'
import { GrTest } from 'react-icons/gr'

export const badgeClass = 'cursor-pointer inline-flex text-foreground items-center gap-1 px-1 py-0.5 font-medium rounded border border-main bg-background hover:bg-card'

export function FactionLink({ factionId, factionName }: { factionId: string, factionName: string }) {
  return (
    <Link href={`/factions/${factionId}`} className={badgeClass}>
      <FiBook />
      {factionName}
    </Link>
  )
}

export function KillteamLink({killteam, newTab}: {killteam: {killteamId : string, killteamName: string}, newTab?: boolean}) {
  const isHomebrew = killteam.killteamId.includes('HBR')
  
  return (
    <Link href={`/killteams/${killteam.killteamId}`} className={badgeClass} target={newTab ? '_blank' : ''}>
      {isHomebrew ? <GrTest /> : <FiList />}
      {killteam.killteamName}
    </Link>
  )
}

export function UserLink({ userName, newTab }: {userName: string, newTab?: boolean}) {
  return (
    <Link href={`/users/${userName}`} className={badgeClass} target={newTab ? '_blank' : ''}>
      <FiUser />
      {userName}
    </Link>
  )
}

/*
  A roster that no longer exists, named from a snapshot taken before it was
  deleted. Deliberately shaped like a RosterLink so it keeps its place in a row
  of badges, but dashed, muted and non-interactive because there is nowhere to
  go. The trash icon carries the meaning on touch devices, where the tooltip
  never shows.
*/
export function DeletedRosterBadge({ rosterName }: { rosterName: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1 py-0.5 font-medium rounded border border-dashed border-border bg-background text-muted cursor-default"
      title={`${rosterName} - this roster has since been deleted`}
    >
      <FiTrash2 />
      {rosterName}
    </span>
  )
}

export function RosterLink({ rosterId, rosterName, toGallery, newTab }: { rosterId: string, rosterName: string, toGallery?: boolean, newTab?: boolean }) {
  const link = toGallery
    ? `/rosters/${rosterId}/gallery`
    : `/rosters/${rosterId}`
  
  return (
    <Link href={link} className={badgeClass} target={newTab ? '_blank' : ''}>
      <FiUsers />
      {rosterName}
    </Link>
  )
}
