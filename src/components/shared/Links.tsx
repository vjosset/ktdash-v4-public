'use client'

import Link from 'next/link'
import { FiBook, FiList, FiUser, FiUsers } from 'react-icons/fi'

export const badgeClass = 'cursor-pointer inline-flex text-foreground items-center gap-1 px-1 py-0.5 font-medium rounded border border-main bg-background hover:bg-card'

export function FactionLink({ factionId, factionName }: { factionId: string, factionName: string }) {
  return (
    <Link href={`/factions/${factionId}`} className={badgeClass}>
      <FiBook />
      {factionName}
    </Link>
  )
}

export function KillteamLink({ killteamId, killteamName }: { killteamId: string, killteamName: string }) {
  return (
    <Link href={`/killteams/${killteamId}`} className={badgeClass}>
      <FiList />
      {killteamName}
    </Link>
  )
}

export function UserLink({ userName }: {userName: string}) {
  return (
    <Link href={`/users/${userName}`} className={badgeClass}>
      <FiUser />
      {userName}
    </Link>
  )
}

export function RosterLink({ rosterId, rosterName }: { rosterId: string, rosterName: string }) {
  return (
    <Link href={`/rosters/${rosterId}`} className={badgeClass}>
      <FiUsers />
      {rosterName}
    </Link>
  )
}
