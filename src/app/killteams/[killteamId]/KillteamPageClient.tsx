'use client'

import OpCard from '@/components/op/OpCard'
import AddRosterForm from '@/components/roster/AddRosterForm'
import RosterEquipment from '@/components/roster/RosterEquipment'
import RosterPloys from '@/components/roster/RosterPloys'
import KillteamMatchStats from '@/components/killteam/KillteamMatchStats'
import RosterSpotlightCard from '@/components/roster/RosterSpotlightCard'
import { badgeClass } from '@/components/shared/Links'
import Button from '@/components/ui/Button'
import Markdown from '@/components/ui/Markdown'
import { TacOps } from '@/lib/utils/operations'
import { showInfoModal } from '@/lib/utils/showInfoModal'
import { getKillteamRepeatedAbilitiesAndOptions } from '@/lib/utils/utils'
import { KillteamPlain } from '@/types'
import { WeaponRulePlain } from '@/types/weaponRule.model'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { FiInfo, FiPrinter, FiThumbsDown, FiThumbsUp } from 'react-icons/fi'
import { toast } from 'sonner'

export default function KillteamPageClient({ killteam }: { killteam: KillteamPlain }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const validTabs = ['operatives', 'composition', 'equipment', 'ploys', 'tacops', 'rosters', 'stats'] as const
  type Tab = typeof validTabs[number]

  // Homebrew teams have too few and too fluid a roster pool for the numbers to mean anything
  const statsEnabled = process.env.NEXT_PUBLIC_ENABLE_MATCHRESULTS === 'true' && !killteam.isHomebrew
  
  const tabParam = searchParams.get('tab')
  const initialTab = validTabs.includes(tabParam as Tab) ? (tabParam as Tab) : 'operatives'

  const [tab, setTab] = useState<Tab>(initialTab)
  const [allWeaponRules, setSpecials] = useState<WeaponRulePlain[] | null>(null)
  const teamTacOps = TacOps.filter((op) => killteam?.archetypes?.includes(op.archetype))
  const { abilities: killteamAbilities, options: killteamOptions } = getKillteamRepeatedAbilitiesAndOptions(killteam)
  const { data: session } = useSession()
  const [voteSummary, setVoteSummary] = useState(killteam.voteSummary ?? { upvotes: 0, downvotes: 0, total: 0, ratio: 0 })
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(
    typeof killteam.userVote === 'undefined' ? null : killteam.userVote
  )
  const [voteSubmitting, setVoteSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/specials')
      .then(res => res.json())
      .then(data => setSpecials(data))
      .catch(err => console.error('Failed to fetch specials', err))
  }, [])

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-2 py-2 border-b-2 transition-colors',
      selected ? 'border-main text-main' : 'border-transparent text-muted hover:text-foreground'
    )

  // ===== Pretty URL helpers =====
  const getBasePath = (path: string) => {
    const parts = path.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (validTabs.includes(last as Tab)) parts.pop()
    return '/' + parts.join('/')
  }

  const getInitialTab = (): Tab => {
    const parts = pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (validTabs.includes(last as Tab)) return last as Tab

    const q = searchParams.get('tab')
    if (validTabs.includes(q as Tab)) return q as Tab

    return 'operatives'
  }

  const basePath = getBasePath(pathname)

  useEffect(() => {
    // Normalize legacy ?tab=... to pretty path once
    const q = searchParams.get('tab')
    if (q && validTabs.includes(q as Tab)) {
      const pretty = q === 'operatives' ? basePath : `${basePath}/${q}`
      router.replace(pretty, { scroll: false })
      return
    }

    // Sync state with current path segment
    const parts = pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    const nextTab = validTabs.includes(last as Tab) ? (last as Tab) : 'operatives'
    if (nextTab !== tab) setTab(nextTab)
     
  }, [pathname, searchParams])

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const nextPath = newTab === 'operatives' ? basePath : `${basePath}/${newTab}`
    router.replace(nextPath, { scroll: false })
  }

  useEffect(() => {
    if (!killteam.isHomebrew) return
    const needsSummary = !killteam.voteSummary
    const needsUserVote = !!session?.user?.userId && typeof killteam.userVote === 'undefined'
    if (!needsSummary && !needsUserVote) return

    let cancelled = false
    fetch(`/api/killteams/${killteam.killteamId}/vote`)
      .then(res => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setVoteSummary(data.voteSummary ?? { upvotes: 0, downvotes: 0, total: 0, ratio: 0 })
        setUserVote(typeof data.userVote === 'undefined' ? null : data.userVote)
      })
      .catch(() => {
        /* ignore */
      })
    return () => { cancelled = true }
  }, [killteam.killteamId, killteam.isHomebrew, killteam.voteSummary, killteam.userVote, session?.user?.userId])

  const handleVote = useCallback(async (choice: 'up' | 'down') => {
    if (!killteam.isHomebrew || !session?.user) return
    if (voteSubmitting) return

    setVoteSubmitting(true)
    const sameSelection = userVote === choice
    const method = sameSelection ? 'DELETE' : 'POST'
    const body = sameSelection ? undefined : JSON.stringify({ value: choice })

    try {
      const res = await fetch(`/api/killteams/${killteam.killteamId}/vote`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data = await res.json()
      setVoteSummary(data.voteSummary ?? { upvotes: 0, downvotes: 0, total: 0, ratio: 0 })
      setUserVote(typeof data.userVote === 'undefined' ? null : data.userVote)
    } catch (err: any) {
      toast.error(err?.message || 'Could not update vote')
    } finally {
      setVoteSubmitting(false)
    }
  }, [killteam.killteamId, killteam.isHomebrew, session?.user, userVote, voteSubmitting])

  const voteRatio = voteSummary.total > 0 ? Math.round((voteSummary.ratio ?? 0) * 100) : 0

  return (
    <div className="max-w-full">
      <div className="noprint flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            className="cursor-pointer items-center p-0 noprint"
            title="Print"
            aria-label="Print"
            onClick={() => window.print()}
          >
            <FiPrinter />
          </Button>
          {killteam.isHomebrew && killteam.isPublished && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={clsx(
                    'inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition',
                    userVote === 'up'
                      ? 'border-main bg-main/10 text-main'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  disabled={voteSubmitting}
                  onClick={() => handleVote('up')}
                  aria-label="Thumbs up"
                  title="Thumbs up"
                >
                  <FiThumbsUp className="h-3.5 w-3.5" />
                  {voteSummary.upvotes}
                </button>
                <button
                  type="button"
                  className={clsx(
                    'inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition',
                    userVote === 'down'
                      ? 'border-red-500 bg-red-500/10 text-red-500'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  disabled={voteSubmitting}
                  onClick={() => handleVote('down')}
                  aria-label="Thumbs down"
                  title="Thumbs down"
                >
                  <FiThumbsDown className="h-3.5 w-3.5" />
                  {voteSummary.downvotes}
                </button>
              </div>
              <span className="text-muted">
                {voteSummary.total > 0 ? `${voteRatio}% positive` : 'No votes yet'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="section relative printonly">
        <div className="columns-2" style={{pageBreakAfter: 'always'}}>
          <div className="section">
            <h5>Composition</h5>
            <Markdown key={'killteamprintcomp'}>
              {killteam.composition}
            </Markdown>
          </div>
          {(killteamAbilities.length + killteamOptions.length > 0) && (
            <div className="">
              <div className="mt-2 overflow-hidden">
                {killteamAbilities.map((ability, idx) => (
                  <div className="section" key={`killteamprintability_${ability.abilityId}`}>
                    {idx == 0 && (
                      <h5>Common Abilities and Options</h5>
                    )}
                    <Markdown>
                      {`**${ability.abilityName}${ability.AP != null ? ` (${ability.AP}AP)` : ''}:**  
                      ${ability.description}`}
                    </Markdown>
                  </div>
                ))}
                {killteamOptions.map((option) => (
                  <div className="section" key={`killteamprintoption_${option.optionId}`}>
                    <Markdown>
                      {`**${option.optionName}:**  
                      ${option.description}`}
                    </Markdown>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto px-2 noprint">
        {/* Tabs  */}
        <div className="flex justify-center space-x-2 border-b border-border mb-4 min-w-max">
          <button className={tabClasses(tab === 'operatives')} onClick={() => handleTabChange('operatives')}>
            Operatives
          </button>
          {false && (
            <button className={tabClasses(tab === 'composition')} onClick={() => handleTabChange('composition')}>
              Composition
            </button>
          )}
          {(killteam?.equipments?.length ?? 0) > 0 && 
            <button className={tabClasses(tab === 'equipment')} onClick={() => handleTabChange('equipment')}>
              Equipment
            </button>
          }
          {(killteam?.ploys?.length ?? 0) > 0 &&
            <button className={tabClasses(tab === 'ploys')} onClick={() => handleTabChange('ploys')}>
              Ploys
            </button>
          }
          <button className={tabClasses(tab === 'tacops')} onClick={() => handleTabChange('tacops')}>
            TacOps
          </button>
          {(killteam?.spotlightRosters?.length ?? 0) > 0 &&
            <button className={tabClasses(tab === 'rosters')} onClick={() => handleTabChange('rosters')}>
              Rosters
            </button>
          }
          {statsEnabled &&
            <button className={tabClasses(tab === 'stats')} onClick={() => handleTabChange('stats')}>
              Stats
            </button>
          }
        </div>
      </div>

      <div key="tabs" className="leading-relaxed px-2">
        {/* Operatives */}
        <div key="operativesTab" className={tab === 'operatives' ? 'block' : 'hidden'}>
          <div className="flex items-center justify-between mb-2 noprint">
            <button className={clsx(badgeClass)} onClick={() => showInfoModal(
              {
                title: 'Composition',
                body:
                  <div>
                    { killteam?.archetypes &&
                      <>
                        <em className="text-main">Archetypes: {killteam?.archetypes ?? 'None'}</em>
                        <hr className="mx-12 my-2" />
                      </>
                    }
                    <Markdown>{killteam?.composition || ''}</Markdown>
                  </div>
              }
            )}>
              <FiInfo /> Composition
            </button>
            <AddRosterForm initialKillteam={killteam} />
          </div>
          <div key="operativesList" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {killteam.opTypes.map((opType) => (
              <OpCard
                key={opType.opTypeId}
                seq={1}
                op={opType}
                isOwner={false}
                roster={null}
                killteam={killteam}
                allWeaponRules={allWeaponRules?.map((rule) => rule) ?? []}
              />
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div key="equipmentTab" className={tab === 'equipment' ? 'block' : 'hidden'}>
          <RosterEquipment killteam={killteam} />
        </div>
        
        {/* Ploys */}
        <div key="ployTab" className={tab === 'ploys' ? 'block' : 'hidden'}>
          <RosterPloys killteam={killteam} isOwner={false} />
        </div>
        
        {/* TacOps */}
        <div key="tacOpsTab" className={tab === 'tacops' ? 'block' : 'hidden'}>
          {teamTacOps.map((op) => {
            return (
              <div key={op.title} className="max-w-3xl items-center mx-auto">
                <h6 className="text-main">{op.archetype}: {op.title}</h6>
                <Markdown>{op.description}</Markdown>
                <hr className="mx-12 my-2" />
              </div>
            )
          })}
        </div>
        
        {/* Recorded battle results */}
        {statsEnabled && (
          <div key="statsTab" className={tab === 'stats' ? 'block' : 'hidden'}>
            <KillteamMatchStats killteamId={killteam.killteamId} />
          </div>
        )}

        {/* Rosters/Spotlight */}
        <div key="rostersTab" className={tab === 'rosters' ? 'block' : 'hidden'}>
          <div className="gap-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {killteam.spotlightRosters?.map((roster) => {
              return (
                <RosterSpotlightCard 
                  key={roster.rosterId}
                  roster={roster}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Additional Info when Printed */}
      <div className="printonly" style={{pageBreakBefore: 'always'}}>
        <div className="section columns-2">
          <div className="section">
            <h5>Equipment</h5>
            
            {killteam.equipments.filter((eq) => eq.killteamId != null).map((eq) => (
              <Fragment key={`killteamprinteq_${eq.eqId}`}>
                <Markdown>
                  {`**${eq.eqName}:**  
                  ${eq.description}`}
                </Markdown>
                <hr className="my-4"/>
              </Fragment>
            ))}
          </div>
          <div className="section">
            <h5>Ploys</h5>
            
            {killteam.ploys.map((ploy) => (
              <Fragment key={`killteamprintploy_${ploy.ployId}`}>
                <Markdown>
                  {`**${ploy.ployType == 'S' ? 'Strategic' : 'Firefight'} - ${ploy.ployName}:**  
                  ${ploy.description}`}
                </Markdown>
                <hr className="my-4"/>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="section">
          <h5>TacOps</h5>

          <div className="columns-2">
            {teamTacOps.map((op) => (
              <div key={op.title} className="max-w-3xl items-center mx-auto section">
                <h6>{op.archetype}: {op.title}</h6>
                <Markdown className="ml-3">{op.description}</Markdown>
                <hr className="my-4"/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
  
