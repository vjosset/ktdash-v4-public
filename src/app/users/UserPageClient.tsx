'use client'

import AddRosterForm from '@/src/components/roster/AddRosterForm'
import RosterCard from '@/src/components/roster/RosterCard'
import { RosterPlain } from '@/types'
import { useState } from 'react'

interface UserPageClientProps {
  rosters: RosterPlain[]
  isOwner: boolean
  userName: string
}

export default function UserPageClient({ rosters: initialRosters, isOwner }: UserPageClientProps) {
  const [rosters, setRosters] = useState(initialRosters)

  const handleDelete = (rosterId: string) => {
    setRosters(rosters => rosters.filter(roster => roster.rosterId !== rosterId))
  }

  // Move roster at index to newIndex
  const moveRoster = async (from: number, to: number) => {
    if (to < 0 || to >= rosters.length) return
    const newRosters = [...rosters]
    const [moved] = newRosters.splice(from, 1)
    newRosters.splice(to, 0, moved)
    setRosters(newRosters)
    

    // Prepare payload: [{ rosterId, seq }]
    const payload = newRosters.map((roster, idx) => ({
      rosterId: roster.rosterId,
      seq: idx + 1,
    }))

    try {
      await fetch('/api/rosters/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      // Optionally handle error (e.g., revert UI or show a message)
      console.error('Failed to reorder rosters', err)
    }
  }

  return (
    <div className="gap-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {rosters.map((roster, idx) => (
        <RosterCard
          key={roster.rosterId}
          roster={roster}
          isOwner={isOwner}
          onMoveUp={isOwner ? () => moveRoster(idx, idx - 1) : () => {}}
          onMoveDown={isOwner ? () => moveRoster(idx, idx + 1) : () => {}}
          onMoveFirst={isOwner ? () => moveRoster(idx, 0) : () => {}}
          onMoveLast={isOwner ? () => moveRoster(idx, rosters.length - 1) : () => {}}
          onDelete={isOwner ? handleDelete : undefined}
        />
      ))}
      {isOwner && <AddRosterForm key="Add Roster" />}
    </div>
  )
}
