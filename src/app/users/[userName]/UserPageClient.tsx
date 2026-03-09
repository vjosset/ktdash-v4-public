'use client'

import KillteamCard from '@/components/killteam/KillteamCard'
import { Button } from '@/components/ui'
import UserBattlesTab from '@/components/user/UserBattlesTab'
import AddRosterForm from '@/src/components/roster/AddRosterForm'
import RosterCard from '@/src/components/roster/RosterCard'
import { UserPlain } from '@/types'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface UserPageClientProps {
  user: UserPlain
  isOwner: boolean
  userName: string
  hasMatchResults?: boolean
}

export default function UserPageClient({ user, isOwner, hasMatchResults = false }: UserPageClientProps) {
  const [rosters, setRosters] = useState(user.rosters)
  const router = useRouter()

  const handleDelete = (rosterId: string) => {
    setRosters((currentRosters) => currentRosters?.filter((roster) => roster.rosterId !== rosterId))
  }

  const validTabs = ['rosters', 'battles', 'killteams'] as const
  type Tab = (typeof validTabs)[number]

  const [tab, setTab] = useState<Tab>('rosters')

  const isHomebrewTeam = (killteam: any) => ((killteam as any).isHomebrew ?? killteam.factionId === 'HBR')
  const userHomebrewKillteams = (user.killteams || []).filter(isHomebrewTeam)
  const hasHomebrew = userHomebrewKillteams.length > 0
  const battlesEnabled = process.env.NEXT_PUBLIC_FEATURE_BATTLES === 'true'
  const showBattlesTab = battlesEnabled && hasMatchResults
  const showTabBar = showBattlesTab || hasHomebrew
  const canCreateHomebrew = isOwner
  const homebrewLimitReached = userHomebrewKillteams.length >= 10

  const handleCreateHomebrew = async () => {
    if (!isOwner) {
      toast.error('You can only create homebrew teams on your own page')
      return
    }
    if (homebrewLimitReached) return

    try {
      const defaultName = `${user.userName}'s Homebrew Team`
      const res = await fetch('/api/killteams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          killteamName: defaultName,
          isPublished: false,
        }),
      })

      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || 'Failed to create homebrew')
      }

      const created = await res.json()
      toast.success('Homebrew created! Redirecting...')
      router.push(`/killteams/${created.killteamId}/edit`)
    } catch (err: any) {
      console.error(err)
      const message = err?.message?.includes('Homebrew limit') ? err.message : 'Could not create homebrew'
      toast.error(message)
    }
  }

  const renderHomebrewButton = () => {
    if (!canCreateHomebrew) return null

    return (
      <div className="text-center">
        <Button disabled={homebrewLimitReached} onClick={handleCreateHomebrew}>
          <h6>{homebrewLimitReached ? 'Limit Reached' : '+ New Homebrew'}</h6>
        </Button>
        {homebrewLimitReached && (
          <div className="text-xs text-muted mt-1">You have 10/10 homebrew teams</div>
        )}
      </div>
    )
  }

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-2 py-2 border-b-2 transition-colors',
      selected ? 'border-main text-main' : 'border-transparent text-muted hover:text-foreground'
    )

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
  }

  const moveRoster = async (from: number, to: number) => {
    if (to < 0 || to >= (rosters?.length ?? 0)) return
    const nextRosters = [...(rosters ?? [])]
    const [moved] = nextRosters.splice(from, 1)
    nextRosters.splice(to, 0, moved)
    setRosters(nextRosters)

    const payload = nextRosters.map((roster, idx) => ({
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
    <div>
      {!showTabBar && isOwner && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <AddRosterForm />
          {renderHomebrewButton()}
        </div>
      )}

      {showTabBar && (
        <div className="overflow-x-auto px-2">
          <div className="flex justify-center space-x-2 border-b border-border mb-4 min-w-max">
            <button className={tabClasses(tab === 'rosters')} onClick={() => handleTabChange('rosters')}>
              Rosters
            </button>
            {showBattlesTab && (
              <button className={tabClasses(tab === 'battles')} onClick={() => handleTabChange('battles')}>
                Battles
              </button>
            )}
            {hasHomebrew && (
              <button className={tabClasses(tab === 'killteams')} onClick={() => handleTabChange('killteams')}>
                Homebrew
              </button>
            )}
          </div>
        </div>
      )}

      <div key="rostersTab" className={!showTabBar || tab === 'rosters' ? 'block' : 'hidden'}>
        {showTabBar && isOwner && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <AddRosterForm />
            {!hasHomebrew && renderHomebrewButton()}
          </div>
        )}
        <div className="gap-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rosters?.map((roster, idx) => (
            <RosterCard
              key={roster.rosterId}
              roster={roster}
              isOwner={isOwner}
              showUser={false}
              showKillteam={true}
              onMoveUp={isOwner ? () => moveRoster(idx, idx - 1) : () => {}}
              onMoveDown={isOwner ? () => moveRoster(idx, idx + 1) : () => {}}
              onMoveFirst={isOwner ? () => moveRoster(idx, 0) : () => {}}
              onMoveLast={isOwner ? () => moveRoster(idx, rosters.length - 1) : () => {}}
              onDelete={isOwner ? handleDelete : undefined}
            />
          ))}
        </div>
      </div>

      {showBattlesTab && (
        <div key="battlesTab" className={tab === 'battles' ? 'block' : 'hidden'}>
          <UserBattlesTab userId={user.userId} isOwner={isOwner} />
        </div>
      )}

      {hasHomebrew && (
        <div key="killteamsTab" className={tab === 'killteams' ? 'block' : 'hidden'}>
          {canCreateHomebrew && (
            <div className="flex justify-center mb-4">
              {renderHomebrewButton()}
            </div>
          )}
          <div className="gap-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {user.killteams?.map((killteam) => (
              <KillteamCard key={killteam.killteamId} killteam={killteam} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
