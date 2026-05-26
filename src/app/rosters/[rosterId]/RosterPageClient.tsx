'use client'

import AddOpForm from '@/components/op/AddOpForm'
import OpCard from '@/components/op/OpCard'
import EditRosterForm from '@/components/roster/EditRosterForm'
import RosterCardMenu from '@/components/roster/RosterCardMenu'
import RosterEquipment from '@/components/roster/RosterEquipment'
import RosterOps from '@/components/roster/RosterOps'
import RosterPloys from '@/components/roster/RosterPloys'
import { badgeClass, KillteamLink, UserLink } from '@/components/shared/Links'
import { Button, Checkbox, Modal } from '@/components/ui'
import CarouselModal, { CarouselItem } from '@/components/ui/CarouselModal'
import Markdown from '@/components/ui/Markdown'
import PageTitle from '@/components/ui/PageTitle'
import { GAME } from '@/lib/config/game_config'
import { getSetting } from '@/lib/settings'
import { getOpPortraitUrl, getRosterPortraitUrl, toEpochMs } from '@/lib/utils/imageUrls'
import { TacOps, TacOps2024 } from '@/lib/utils/operations'
import { showInfoModal } from '@/lib/utils/showInfoModal'
import { getRosterRepeatedAbilitiesAndOptions } from '@/lib/utils/utils'
import { WeaponRule } from '@/lib/utils/weaponRules'
import { OpPlain, RosterPlain } from '@/types'
import { Menu, MenuButton } from '@headlessui/react'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaPencil } from 'react-icons/fa6'
import { FiDownload, FiInfo, FiList, FiMoreVertical, FiPrinter, FiRotateCcw, FiStar } from 'react-icons/fi'
import { toast } from 'sonner'
import OpponentTab from './OpponentTab'

export default function RosterPageClient({
  initialRoster,
  isOwner,
}: {
  initialRoster: RosterPlain
  isOwner: boolean
}) {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Get ?tab= value from the URL
  const validTabs = ['operatives', 'equipment', 'ploys', 'ops', 'gallery', 'opponent'] as const
  type Tab = typeof validTabs[number]

  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Strip a final "/{tab}" if present, to get the stable base like "/rosters/{id}"
  const getBasePath = (path: string) => {
    const parts = path.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (validTabs.includes(last as Tab)) parts.pop()
    return '/' + parts.join('/')
  }

  // Determine the current tab from either the path segment or the query (?tab=...)
  // Path takes precedence; query supports legacy links & the rewrite.
  const getInitialTab = (): Tab => {
    const parts = pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (validTabs.includes(last as Tab)) return last as Tab

    const tabParam = searchParams.get('tab')
    if (validTabs.includes(tabParam as Tab)) return tabParam as Tab

    // Default to 'operatives' if no valid tab found
    return 'operatives'
  }

  const basePath = getBasePath(pathname)

  const tabParam = searchParams.get('tab')
  const initialTab = validTabs.includes(tabParam as Tab) ? (tabParam as Tab) : 'operatives'

  const [tab, setTab] = useState<Tab>(initialTab)

  const [ops, setOps] = useState<OpPlain[]>(initialRoster.ops ?? [])
  const [roster, setRoster] = useState(initialRoster)
  const [allWeaponRules, setSpecials] = useState<WeaponRule[] | null>(null)
  const formRef = useRef<{ handleSubmit: () => void }>(null)
  const [showResetModal, setShowResetModal] = useState<Boolean>(false)
  const [showEditRosterModal, setShowEditRosterModal] = useState<Boolean>(false)
  const [carouselIsOpen, setCarouselIsOpen] = useState(false)
  const [carouselStartIndex, setCarouselStartIndex] = useState(0)
  const [showDeploymentModal, setShowDeploymentModal] = useState(false)
  
  // For printing
  // Get operative unique abilities and options
  const { abilities: rosterAbilities, options: rosterOptions } = getRosterRepeatedAbilitiesAndOptions(roster ?? undefined)
  
  // Get non-Universal equipment
  const printEquipment = roster.killteam?.equipments.filter((eq) => eq.killteamId != null)

  // Get TacOps
  const tacOps = getSetting('tacOps') == '2024' ? TacOps2024 : TacOps
  const printTacOps = tacOps.filter((op) => roster?.killteam?.archetypes?.includes(op.archetype))

  useEffect(() => {
    fetch('/api/specials')
      .then(res => res.json())
      .then(data => setSpecials(data))
      .catch(err => console.error('Failed to fetch specials', err))
  }, [])

  useEffect(() => {
    setOps(roster.ops ?? [])
  }, [roster.ops])
  
  const rosterTotalWounds = useMemo(
    () => ops.reduce((sum, op) => sum + (op.opType?.WOUNDS ?? 0), 0),
    [ops]
  )
  
  const openCarousel = () => {
    setCarouselIsOpen(true)
  }

  const closeCarousel = () => {
    setCarouselIsOpen(false)
  }

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-2 py-2 border-b-2 transition-colors',
      selected
        ? 'border-main text-main'
        : 'border-transparent text-muted hover:text-foreground'
    )
  
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)

    // Opponent tab is ephemeral — don't pollute the URL
    if (newTab === 'opponent') return

    // Default tab omits the trailing segment (stays at /rosters/:id)
    const nextPath =
      newTab === 'operatives' || (newTab === 'gallery' && carouselItems.length === 0)
        ? basePath
        : `${basePath}/${newTab}`

    router.replace(nextPath, { scroll: false })
  }

  useEffect(() => {
    // If someone arrives via /rosters/:id?tab=equipment, upgrade the URL to /rosters/:id/equipment
    const q = searchParams.get('tab')
    if (q && validTabs.includes(q as Tab)) {
      const pretty = q === 'operatives' ? basePath : `${basePath}/${q}`
      router.replace(pretty, { scroll: false })
    }

    // Also handle if user navigates to another pretty path (e.g., via browser back)
    const parts = pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    const nextTab = validTabs.includes(last as Tab) ? (last as Tab) : 'operatives'
    if (nextTab !== tab) setTab(nextTab)
    
     
  }, [pathname, searchParams])  // keep deps as pathname + searchParams

  const updateOp = (updated: OpPlain) => {
    setOps(prev =>
      prev.map(u => (u.opId === updated.opId ? updated : u))
    )
  }

  const deleteOp = async(opId: string) => {
    // Remove the op locally from the array
    const updatedOps = ops.filter(u => u.opId !== opId)

    // Update local state
    setOps(updatedOps)

    // Update op Seqs so they stay sequential and in order
    await updateOpSeqs(updatedOps)
  }

  const addOp = async(newOp: OpPlain) => {
    const updatedOps = [...ops, newOp]
    setOps(updatedOps)
    await updateOpSeqs(updatedOps)
  }

  const updateRosterField = async (field: string, value: number) => {
    if (value < 0) return
    if (value < 1 && field == 'turn') return

    const patch: Partial<typeof roster> = { [field]: value }

    // Note the API/service will handle resetting op activation on turn increase
    const res = await fetch(`/api/rosters/${roster.rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  
    if (res.ok) {
      const updated = await res.json()
      setRoster(updated)
    } else {
      console.error('Failed to update roster field:', field)
    }
  }
  
  const updateRosterInfo = async (name: string, description: string | null) => {
    const res = await fetch(`/api/rosters/${roster.rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        rosterName: name,
        description: description
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setRoster(updated)
      setShowEditRosterModal(false)
    } else {
      console.error('Failed to update roster info')
      toast.error('Failed to save roster')
    }
  }

  const handleResetClick = () => { setShowResetModal(true)}

  const handleRosterPrint = () => {
    window.print()
  }

  const handleEditRosterClick = () => { setShowEditRosterModal(true)}

  const toggleSpotlight = async (rosterId: string) => {
    const res = await fetch(`/api/rosters/${roster.rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        isSpotlight: !roster.isSpotlight
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setRoster(updated)
    } else {
      console.error('Failed to update roster spotlight')
      toast.error('Failed to save roster spotlight')
    }
  }

  // Add resetRoster function after other state updates
  const resetRoster = async () => {
    const res = await fetch(`/api/rosters/${roster.rosterId}/reset`, {
      method: 'POST',
    })

    if (res.ok) {
      const updated = await res.json()
      setRoster(updated)
      // Reset all ops' activation state
      setOps(prev => prev.map(op => ({ ...op, isActivated: false })))
      toast.success('Roster reset')
    } else {
      console.error('Failed to reset game')
      toast.error('Failed to reset roster')
    }
  }

  // Group-aware reorder within deployed/reserve, without boundary crossing
  const reorderOp = async(opId: string, action: 'up' | 'down' | 'top' | 'bottom') => {
    const op = ops.find(o => o.opId === opId)
    if (!op) return

    // Build the visible group sorted by global seq
    const group = ops.filter(o => o.isDeployed === op.isDeployed).slice().sort((a, b) => a.seq - b.seq)
    const idx = group.findIndex(o => o.opId === opId)
    if (idx < 0) return

    let updates: Array<{ opId: string; seq: number }> = []
    let normalize = false

    if (action === 'up') {
      if (idx === 0) return // already at top of group
      const neighbor = group[idx - 1]
      updates = [
        { opId: op.opId, seq: neighbor.seq },
        { opId: neighbor.opId, seq: op.seq },
      ]
    } else if (action === 'down') {
      if (idx === group.length - 1) return // already at bottom of group
      const neighbor = group[idx + 1]
      updates = [
        { opId: op.opId, seq: neighbor.seq },
        { opId: neighbor.opId, seq: op.seq },
      ]
    } else if (action === 'top') {
      if (idx === 0) return
      updates = [{ opId: op.opId, seq: -1 }] // sentinel to bubble to top
      normalize = true
    } else if (action === 'bottom') {
      if (idx === group.length - 1) return
      updates = [{ opId: op.opId, seq: 1000 }] // sentinel to sink to bottom
      normalize = true
    }

    try {
      const res = await fetch('/api/ops/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, normalize }),
      })
      if (!res.ok) throw new Error('Failed to reorder ops')

      // Server returns full updated roster
      const updated = await res.json()
      setRoster(updated)
      setOps(updated.ops ?? [])
    } catch (err) {
      console.error('Failed to reorder ops', err)
      // No optimistic update; UI remains unchanged on failure
    }
  }

  const updateOpSeqs = async(ops: OpPlain[]) => {
    // Prepare payload: [{ opId, seq }]
    const payload = ops.map((op, idx) => ({
      opId: op.opId,
      seq: idx + 1,
    }))

    try {
      await fetch('/api/ops/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      // Optionally handle error (e.g., revert UI or show a message)
      console.error('Failed to reorder ops', err)
    }
  }

  const carouselItems: CarouselItem[] = []
  if (roster.hasCustomPortrait) {
    carouselItems.push({title: roster.rosterName, imageUrl: `${getRosterPortraitUrl(roster.rosterId)}?v=${toEpochMs(roster.portraitUpdatedAt)}` })
  }
  roster.ops?.filter(op => op.hasCustomPortrait).map(op => op.hasCustomPortrait && carouselItems.push({title: op.opName, imageUrl: `${getOpPortraitUrl(op.opId)}?v=${toEpochMs(op.portraitUpdatedAt)}`}))

  const handlePortraitClick = (clickedUrl: string) => {
    const index = carouselItems.findIndex(item => item.imageUrl === clickedUrl)
    console.log('  Found at index', index)
    if (index >= 0) {
      setCarouselStartIndex(index)
      openCarousel()
    }
  }

  return (
    <>
      {/* Full-width roster header - Web */}
      <div className="relative w-full min-h-[150px] md:min-h-[150px] noprint">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{
            backgroundImage: `url('${
              roster.hasCustomPortrait
                ? `${getRosterPortraitUrl(roster.rosterId)}?v=${toEpochMs(roster.portraitUpdatedAt)}`
                : (roster.killteam?.isHomebrew && roster.killteam?.userId
                  ? `/api/killteams/${roster.killteam?.killteamId}/portrait`
                  : `/img/killteams/${roster.killteam?.killteamId}.webp`)
            }')`,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/80 to-background" />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col items-center justify-end text-center h-full pt-28 md:pt-20 pb-6 px-4 print:pt-1 print:pb-1">
          <div className="cursor-pointer flex items-center gap-2">
            <PageTitle onClick={isOwner && handleEditRosterClick}>
              {roster.rosterName} {isOwner && (<sup><FaPencil className="inline text-xs" /></sup>)}
            </PageTitle>
          </div>

          {/* Meta info below title */}
          <div className="flex items-center flex-wrap justify-center gap-2 text-muted-foreground text-sm mt-2">
            {roster.killteam && (
              <KillteamLink
                killteam={roster.killteam}
              />
            )}
            <span>by</span>
            <UserLink userName={roster.user?.userName || 'Unknown User'} />

            {!isOwner && status === 'authenticated' && (
              <Button
                className="cursor-pointer items-center p-0 noprint"
                title="Import this roster to your Rosters"
                aria-label="Import this roster"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/rosters/${roster.rosterId}/clone`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        rosterName: roster.rosterName,
                        killteamId: roster.killteamId,
                      }),
                    })

                    if (!res.ok) throw new Error('Failed to import roster')

                    const { rosterId } = await res.json()
                    router.push(`/rosters/${rosterId}`)
                  } catch (err) {
                    console.error(err)
                    toast.error('Could not import roster')
                  }
                }}
              >
                <FiDownload />
              </Button>
            )}
            
            {!isOwner && (
              <Button
                className="cursor-pointer items-center p-0 noprint"
                title="Print"
                aria-label="Print"
                onClick={() => window.print()}
              >
                <FiPrinter />
              </Button>
            )}
          </div>

          {roster.killteamId == 'SPEC-NPO' &&
            <>
              <br/>
              <h6>Total Wounds: { rosterTotalWounds } </h6>
            </>
          }

          {/* Description below meta */}
          {roster.description && (
            <div className="mt-4 max-w-2xl text-sm text-muted-foreground align-left max-h-[150px] overflow-y-auto noprint">
              <Markdown className="text-left">{roster.description}</Markdown>
            </div>
          )}
        </div>
      </div>
      
      {/* Full-width roster header - Print */}
      <div className="section relative printonly" style={{ zoom: '150%' }}>
        <h1 className="text-center mb-4">{roster.rosterName}</h1>
        <div className="columns-2 mb-8">
          <div>
            {roster.killteam && (
              <KillteamLink killteam={roster.killteam} />
            )}
            { ' ' }
            by <UserLink userName={roster.user?.userName || 'Unknown User'} />
            { ' ' }
          </div>
          <div>
            <QRCodeSVG value={`${GAME.ROOT_URL}/rosters/${roster.rosterId}`} size={100} />
            <Link href={`${GAME.ROOT_URL}/rosters/${roster.rosterId}`}>{GAME.ROOT_URL}/rosters/{roster.rosterId}</Link>
          </div>
        </div>

        {/* Summary of abilities */}
        {(rosterAbilities.length + rosterOptions.length > 0) && (
          <div>
            <h5>Common Abilities and Options</h5>
            <div className="mt-2 overflow-hidden">
              {rosterAbilities.map((ability) => (
                <Markdown key={`rosterprintability_${ability.abilityId}`}>
                  {`**${ability.abilityName}${ability.AP != null ? ` (${ability.AP}AP)` : ''}:**  
                  ${ability.description}`}
                </Markdown>
              ))}
              {rosterOptions.map((option) => (
                <Markdown key={`rosterprintoption_${option.optionId}`}>
                  {`**${option.optionName}:**  
                  ${option.description}`}
                </Markdown>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trackers */}
      {isOwner && (
        <div className="sticky top-0 lg:top-[3.5rem] max-w-xl mx-auto z-20 bg-background py-2 px-1 flex gap-2 items-center justify-between noprint" >
          {[
            { label: 'TURN', key: 'turn' },
            { label: 'VP', key: 'VP' },
            { label: 'CP', key: 'CP' },
          ].map(({ label, key }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <h6 className="font-bold text-main">{label}:</h6>
              <div className="flex items-center">
                {isOwner && (
                  <button
                    className="flex items-center justify-center rounded border border-border w-6 h-6 text-lg"
                    onClick={() => updateRosterField(key, roster[key as 'turn' | 'VP' | 'CP'] - 1)}
                  >−</button>
                )}
                <h4 className="stat w-7 text-center">{roster[key as 'turn' | 'VP' | 'CP']}</h4>
                {isOwner && (
                  <button
                    className="flex items-center justify-center rounded border border-border w-6 h-6 text-lg"
                    onClick={() => updateRosterField(key, roster[key as 'turn' | 'VP' | 'CP'] + 1)}
                  >+</button>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <h6 className="font-bold text-main invisible">1</h6>
            <div key="resetEditRoster" className="flex items-center">
              <div className="flex gap-2 items-center justify-center">
                <button
                  className="flex items-center justify-center rounded border border-border w-6 h-6 text-lg"
                  onClick={handleResetClick}
                >
                  <FiRotateCcw/>
                </button>
              </div>
              <div className="flex gap-2 items-center justify-center">
                <Menu as="div" className="relative justify-center flex-shrink-0 rounded border border-border w-6 h-6 text-lg">
                  <MenuButton as="button" className="w-full h-full flex items-center justify-center">
                    <FiMoreVertical />
                  </MenuButton>
                  <RosterCardMenu
                    roster={roster}
                    isOwner={isOwner}
                    onEdit={handleEditRosterClick}
                    onPrint={handleRosterPrint}
                  />
                </Menu>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto print:max-w-none">
        {/* Tabs  */}
        {(isOwner || (carouselItems.length > 0)) && (
          <div className="overflow-x-auto px-2 noprint">
            <div className="flex justify-center space-x-2 border-b border-border mb-4">
              <button className={tabClasses(tab === 'operatives')} onClick={() => handleTabChange('operatives')}>
                Operatives
              </button>
              {isOwner && (roster.killteam?.equipments?.length ?? 0) > 0 && 
                <button className={tabClasses(tab === 'equipment')} onClick={() => handleTabChange('equipment')}>
                  Equip
                </button>
              }
              {isOwner && (roster.killteam?.ploys?.length ?? 0) > 0 &&
                <button className={tabClasses(tab === 'ploys')} onClick={() => handleTabChange('ploys')}>
                  Ploys
                </button>
              }
              {isOwner && roster && 
                <button className={tabClasses(tab === 'ops')} onClick={() => handleTabChange('ops')}>
                  Ops
                </button>
              }
              {roster && carouselItems.length > 0 &&
                <button className={tabClasses(tab === 'gallery')} onClick={() => handleTabChange('gallery')}>
                  Gallery
                </button>
              }
              {isOwner &&
                <button className={tabClasses(tab === 'opponent')} onClick={() => handleTabChange('opponent')}>
                  Opponent
                </button>
              }
            </div>
          </div>
        )}
        
        {/* Tab Content */}
        <div className="leading-relaxed px-1">
          {/* Operatives */}
          <div className={tab === 'operatives' ? 'block' : 'hidden'} style={{ pageBreakBefore: 'always'}}>
            <h3 className="font-title text-main text-center printonly mb-2">Operatives</h3>
            {isOwner && (
              <div className="flex justify-between items-center mb-2 noprint">
                <button className={clsx(badgeClass, 'mb-2')} onClick={() => showInfoModal(
                  {
                    title: 'Composition',
                    body:
                      <div>
                        { roster.killteam?.archetypes && 
                          <>
                            <em className="text-main">Archetypes: {roster.killteam?.archetypes ?? 'None'}</em>
                            <hr className="mx-12 my-2" />
                          </>
                        }
                        <Markdown>{roster.killteam?.composition || ''}</Markdown>
                      </div>
                  }
                )}>
                  <FiInfo /> Composition
                </button>
                <button className={clsx(badgeClass, 'mb-2')} onClick={() => setShowDeploymentModal(true)}>
                  <FiList /> Deploy/Reserve
                </button>
              </div>
            )}

            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Deployed Ops */}
                {ops.filter((op) => op.isDeployed).map((op, idx) => {
                  return (
                    <OpCard
                      key={op.opId}
                      seq={idx + 1}
                      op={op}
                      roster={roster}
                      killteam={roster.killteam ?? null}
                      isOwner={isOwner}
                      allWeaponRules={allWeaponRules ?? []}
                      onOpUpdated={updateOp}
                      onOpDeleted={deleteOp}
                      onMoveUp={isOwner ? () => reorderOp(op.opId, 'up') : () => {}}
                      onMoveDown={isOwner ? () => reorderOp(op.opId, 'down') : () => {}}
                      onMoveFirst={isOwner ? () => reorderOp(op.opId, 'top') : () => {}}
                      onMoveLast={isOwner ? () => reorderOp(op.opId, 'bottom') : () => {}}
                      onPortraitClick={() => handlePortraitClick(`${getOpPortraitUrl(op.opId)}?v=${toEpochMs(op.portraitUpdatedAt)}`)}
                    />)
                })}
                {/* Add Op Button */}
                {isOwner && (
                  <AddOpForm
                    key="Add Operative"
                    roster={roster}
                    allWeaponRules={allWeaponRules ?? []}
                    onOpAdded={addOp}
                  />
                )}
              </div>

              {/* Reserves Section */}
              {ops.some(op => !op.isDeployed) && (
                <div className="noprint grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <h4 className="col-span-full text-muted tracking-wide mt-2">
                    Reserves
                  </h4>
                  {ops.filter(op => !op.isDeployed).map((op, idx) => (
                    <OpCard
                      key={op.opId}
                      seq={idx + 1}
                      op={op}
                      roster={roster}
                      killteam={roster.killteam ?? null}
                      isOwner={isOwner}
                      allWeaponRules={allWeaponRules ?? []}
                      onOpUpdated={updateOp}
                      onOpDeleted={deleteOp}
                      onMoveUp={isOwner ? () => reorderOp(op.opId, 'up') : () => {}}
                      onMoveDown={isOwner ? () => reorderOp(op.opId, 'down') : () => {}}
                      onMoveFirst={isOwner ? () => reorderOp(op.opId, 'top') : () => {}}
                      onMoveLast={isOwner ? () => reorderOp(op.opId, 'bottom') : () => {}}
                      onPortraitClick={() =>
                        handlePortraitClick(`${getOpPortraitUrl(op.opId)}?v=${toEpochMs(op.portraitUpdatedAt)}`)
                      }
                    />
                  ))}
                </div>
              )}
            </>
          </div>

          {/* Equipment */}
          <div className={tab === 'equipment' ? 'block' : 'hidden'}>
            <RosterEquipment killteam={roster.killteam} roster={roster} onRosterUpdate={(updated) => setRoster(updated)} />
          </div>

          {/* Ploys */}
          <div className={tab === 'ploys' ? 'block' : 'hidden'}>
            <RosterPloys roster={roster} killteam={roster.killteam} isOwner={isOwner} onRosterUpdate={(updated) => setRoster(updated)} />
          </div>

          {/* Ops */}
          <div className={tab === 'ops' ? 'block' : 'hidden'}>
            <RosterOps roster={roster} onRosterUpdate={(updated) => setRoster(updated)} />
          </div>

          {/* Opponent — always mounted when owner so state survives tab switches */}
          {isOwner && (
            <div className={tab !== 'opponent' ? 'hidden' : undefined}>
              <OpponentTab
                myRosterId={roster.rosterId}
                allWeaponRules={allWeaponRules ?? []}
                isActive={tab === 'opponent'}
              />
            </div>
          )}

          {/* Gallery */}
          <div className={tab === 'gallery' ? 'block' : 'hidden'}>
            {session?.user?.userId == 'vince' && (
              roster.user?.isPrivate ? (
                <div className="flex items-center gap-2 text-muted cursor-not-allowed" title="User has set their rosters to private">
                  <Checkbox checked={false} onChange={() => {}} disabled />
                  <FiStar /> Spotlight Off (user is private)
                </div>
              ) : (
                <div className={`flex items-center gap-2 cursor-pointer ${roster.isSpotlight ? 'text-main' : 'text-muted'}`} onClick={() => toggleSpotlight(roster.rosterId)}>
                  <Checkbox checked={roster.isSpotlight} onChange={() => {}} /* Handled by parent container*/ />
                  <FiStar /> Spotlight {roster.isSpotlight ? 'On' : 'Off'}
                </div>
              )
            )}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {carouselItems.map((img) => {
                return (
                  <div key={`gallery_${img.imageUrl}`}>
                    <h5 className="font-main text-heading">{img.title}</h5>
                    <img src={img.imageUrl} title={img.title} onClick={() => handlePortraitClick(img.imageUrl)} loading="lazy" decoding="async" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Additonal Info for Print */}
        <div className="printonly section" style={{ zoom: '110%', pageBreakBefore: 'always' }}>
          {/* Equipment (excluding Universal) */}
          <div className="section mb-4">
            <h3 className="font-title text-main text-center">Equipment</h3>
            <div className="columns-2">
              {printEquipment?.map((eq) => {
                return (
                  <div key={eq.eqId} className="section border border-border rounded p-1 m-1">
                    <h5>{eq.eqName}</h5>
                    <Markdown>
                      {eq.description}
                    </Markdown>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ploys */}
          <div className="section mb-4">
            <h3 className="font-title text-main text-center">Ploys</h3>
            <div className="columns-2">
              {roster.killteam?.ploys?.map((ploy) => {
                return (
                  <div key={ploy.ployId} className="section border border-border rounded p-1 m-1">
                    <h5>{ploy.ployName}</h5>
                    <em className="text-sm">{ploy.ployType == 'S' ? 'Strategy ' : 'Firefight '} Ploy</em>
                    <Markdown>
                      {ploy.description}
                    </Markdown>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TacOps */}
          <div className="section">
            <h3 className="font-title text-main text-center">Tac Ops</h3>
            <div className="columns-2">
              {printTacOps?.map((op) => {
                return (
                  <div key={op.title} className="section border border-border rounded p-1 m-1">
                    <h5>{op.title}</h5>
                    <em className="text-sm">{op.archetype}</em>
                    <Markdown>
                      {op.description}
                    </Markdown>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {showResetModal && (
          <Modal
            title="Reset Game"
            onClose={() => setShowResetModal(false)}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowResetModal(false)}>
                  <h6>Cancel</h6>
                </Button>
                <Button
                  onClick={() => {
                    resetRoster()
                    setShowResetModal(false)
                  }}
                >
                  <h6>Reset</h6>
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <p>
                Are you sure you want to reset the roster?<br/>
                This will set Turn to 1, set VP and CP to zero, and reset all ops' wounds and activation.
              </p>
            </div>
          </Modal>
        )}

        {showEditRosterModal && (
          <Modal
            title={roster.rosterName}
            onClose={() => setShowEditRosterModal(false)}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowEditRosterModal(false)}>
                  <h6>Cancel</h6>
                </Button>
                <Button onClick={() => formRef.current?.handleSubmit()}>
                  <h6>Save</h6>
                </Button>
              </div>
            }>
              
            <EditRosterForm
              ref={formRef} // Pass formRef to EditRosterForm
              roster={roster}
              initialName={roster.rosterName}
              initialDescription={roster.description ?? ''}
              rosterId={roster.rosterId}
              hasCustomPortrait={roster.hasCustomPortrait}
              onSave={(name, description) => {
                updateRosterInfo(name, description)
                setShowEditRosterModal(false)
              }}
              onCancel={() => setShowEditRosterModal(false)}
            />
          </Modal>
        )}

        <CarouselModal
          items={carouselItems}
          initialIndex={carouselStartIndex}
          isOpen={carouselIsOpen}
          onClose={() => closeCarousel()}
        />
        {showDeploymentModal && (
          <Modal
            title="Deploy/Reserve"
            footer={null}
            onClose={() => setShowDeploymentModal(false)}
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {ops.map((op, idx) => {
                const toggle = async (next: boolean) => {
                  // optimistic update
                  setOps(prev => prev.map(o => o.opId === op.opId ? { ...o, isDeployed: next } : o))

                  try {
                    const res = await fetch(`/api/ops/${op.opId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isDeployed: next }),
                    })
                    if (!res.ok) throw new Error('Failed to update deployment')
                  } catch (err) {
                    console.error(err)
                    toast.error(`Could not update ${op.opName}`)
                    // rollback
                    setOps(prev => prev.map(o => o.opId === op.opId ? { ...o, isDeployed: !next } : o))
                  }
                }

                const onRowActivate = () => toggle(!op.isDeployed)

                return (
                  <div
                    key={op.opId}
                    role="button"
                    tabIndex={0}
                    onClick={onRowActivate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowActivate()
                      }
                    }}
                    className="flex items-center justify-between border-border border-b pb-2 cursor-pointer select-none px-1"
                    aria-pressed={op.isDeployed}
                  >
                    <div className="flex items-center gap-2">
                      {/* Checkbox mirrors state; don't let it handle the toggle itself */}
                      <Checkbox
                        id={`deploy_${op.opId}`}
                        checked={op.isDeployed}
                        readOnly // avoid double toggle
                      />
                      <div>
                        <h6 className="font-bold">
                          {(op.seq)}. {op.opName || op.opType?.opTypeName}
                        </h6>
                        <p className="text-muted-foreground text-sm">{op.opType?.opTypeName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {op.isDeployed ? 'Deployed' : 'Reserve'}
                    </div>
                  </div>
                )
              })}
            </div>

          </Modal>
        )}
      </div>
    </>
  )
}
