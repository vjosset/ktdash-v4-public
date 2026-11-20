'use client'

import KillteamCard from '@/components/killteam/KillteamCard'
import { isAwaitingUser } from '@/components/shared/BattleActions'
import { Button } from '@/components/ui'
import CountBadge from '@/components/ui/CountBadge'
import Input from '@/components/ui/Input'
import UserBattlesTab from '@/components/user/UserBattlesTab'
import AddRosterForm from '@/src/components/roster/AddRosterForm'
import RosterCard from '@/src/components/roster/RosterCard'
import { BattlePlain, UserPlain } from '@/types'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// The roster search bar only appears once the list is long enough to need it
const ROSTER_SEARCH_MIN_COUNT = 8

interface UserPageClientProps {
  user: UserPlain
  isOwner: boolean
  userName: string
  // Already filtered for the viewer: empty when the flag is off, and confirmed
  // battles only unless the viewer is this user
  battles: BattlePlain[]
}

export default function UserPageClient({ user, isOwner, battles }: UserPageClientProps) {
  const [rosters, setRosters] = useState(user.rosters)
  const router = useRouter()

  // On mount (including back-navigation from router cache), fetch fresh server data
  useEffect(() => { router.refresh() }, [router])

  // Sync local state when server data updates after refresh
  useEffect(() => { setRosters(user.rosters) }, [user.rosters])

  // Battles are confirmed/removed from the Battles tab; held here so the tab
  // badge below stays in step with the list
  const [battleList, setBattleList] = useState(battles)
  useEffect(() => { setBattleList(battles) }, [battles])

  const handleBattleConfirmed = (updated: BattlePlain) =>
    setBattleList(prev => prev.map(b => (b.battleId === updated.battleId ? updated : b)))
  const handleBattleRemoved = (battleId: number) =>
    setBattleList(prev => prev.filter(b => b.battleId !== battleId))

  // Only battles this user can act on - ones they reported are waiting on someone else
  const pendingBattleCount = isOwner ? battleList.filter(b => isAwaitingUser(b, user.userId)).length : 0

  const [rosterQuery, setRosterQuery] = useState('')
  const normalizedQuery = rosterQuery.trim().toLowerCase()
  const isSearching = normalizedQuery !== ''
  // Based on the total, not the filtered count, and kept while a query is
  // active so the bar never disappears with a filter still applied
  const showRosterSearch = (rosters?.length ?? 0) > ROSTER_SEARCH_MIN_COUNT || rosterQuery !== ''

  // Keep each roster's index in the full list - moveRoster works on that list
  const visibleRosters = (rosters ?? [])
    .map((roster, idx) => ({ roster, idx }))
    .filter(({ roster }) =>
      !isSearching ||
      roster.rosterName?.toLowerCase().includes(normalizedQuery) ||
      roster.killteam?.killteamName?.toLowerCase().includes(normalizedQuery)
    )

  const handleDelete = (rosterId: string) => {
    setRosters((currentRosters) => currentRosters?.filter((roster) => roster.rosterId !== rosterId))
  }

  const _validTabs = ['rosters', 'killteams', 'battles'] as const
  type Tab = (typeof _validTabs)[number]

  const [tab, setTab] = useState<Tab>('rosters')

  const isHomebrewTeam = (killteam: any) => ((killteam as any).isHomebrew ?? killteam.factionId === 'HBR')
  const userHomebrewKillteams = (user.killteams || []).filter(isHomebrewTeam)
  const hasHomebrew = userHomebrewKillteams.length > 0
  // Keep the tab while it is open, so removing the last battle leaves an empty
  // list rather than a page with no tab content
  const hasBattles = battleList.length > 0 || tab === 'battles'
  // The tab bar used to exist only for homebrew. With no homebrew and no
  // battles, every condition below reduces to exactly what it was before.
  const showTabs = hasHomebrew || hasBattles
  const canCreateHomebrew = isOwner
  const homebrewLimitReached = userHomebrewKillteams.length >= 50

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
          <div className="text-xs text-muted mt-1">You have 50/50 homebrew teams</div>
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
      {!showTabs && isOwner && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <AddRosterForm />
          {renderHomebrewButton()}
        </div>
      )}

      {showTabs && (
        <div className="overflow-x-auto px-2">
          {/* Tabs */}
          <div className="flex justify-center space-x-2 border-b border-border mb-4 min-w-max">
            <button className={tabClasses(tab === 'rosters')} onClick={() => handleTabChange('rosters')}>
              Rosters
            </button>
            {hasBattles && (
              <button className={tabClasses(tab === 'battles')} onClick={() => handleTabChange('battles')}>
                Battles
                <CountBadge
                  count={pendingBattleCount}
                  title={`${pendingBattleCount} battle${pendingBattleCount === 1 ? '' : 's'} awaiting your confirmation`}
                />
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

      <div key="rostersTab" className={!showTabs || tab === 'rosters' ? 'block' : 'hidden'}>
        {/* With tabs but no Homebrew tab (battles only), the homebrew button has
            nowhere else to live, so it joins Add Roster here rather than vanish */}
        {showTabs && isOwner && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <AddRosterForm />
            {!hasHomebrew && renderHomebrewButton()}
          </div>
        )}
        {showRosterSearch && (
          <div className="max-w-md mx-auto mb-4 px-2">
            <Input
              type="search"
              placeholder="Search rosters or kill teams..."
              aria-label="Search rosters"
              value={rosterQuery}
              onChange={(e) => setRosterQuery(e.target.value)}
              className="my-0 px-2"
            />
            {isSearching && (
              <div className="text-xs text-muted mt-1 text-center">
                Showing {visibleRosters.length} of {rosters?.length ?? 0}
              </div>
            )}
          </div>
        )}
        {isSearching && visibleRosters.length === 0 && (
          <div className="text-center text-muted text-sm">No rosters match &quot;{rosterQuery.trim()}&quot;</div>
        )}
        <div className="gap-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRosters.map(({ roster, idx }) => {
            // Moving within a filtered list would jump over hidden rosters, so
            // reordering is only offered on the full list
            const canMove = isOwner && !isSearching
            return (
              <RosterCard
                key={roster.rosterId}
                roster={roster}
                isOwner={isOwner}
                showUser={false}
                showKillteam={true}
                onMoveUp={canMove ? () => moveRoster(idx, idx - 1) : undefined}
                onMoveDown={canMove ? () => moveRoster(idx, idx + 1) : undefined}
                onMoveFirst={canMove ? () => moveRoster(idx, 0) : undefined}
                onMoveLast={canMove ? () => moveRoster(idx, (rosters?.length ?? 1) - 1) : undefined}
                onDelete={isOwner ? handleDelete : undefined}
              />
            )
          })}
        </div>
      </div>

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

      {hasBattles && (
        <div key="battlesTab" className={tab === 'battles' ? 'block' : 'hidden'}>
          <UserBattlesTab
            battles={battleList}
            userId={user.userId}
            isOwner={isOwner}
            onBattleConfirmed={handleBattleConfirmed}
            onBattleRemoved={handleBattleRemoved}
          />
        </div>
      )}
    </div>
  )
}
