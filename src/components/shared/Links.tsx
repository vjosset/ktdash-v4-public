'use client'

import Link from 'next/link'
import { FiBook, FiList, FiUser, FiUsers } from 'react-icons/fi'
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
