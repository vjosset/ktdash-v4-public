'use client'

import { useLocalSettings } from '@/hooks/useLocalSettings'
import { getOpPortraitUrl, toEpochMs } from '@/lib/utils/imageUrls'
import { showInfoModal } from '@/lib/utils/showInfoModal'
import { getOpTypeUniqueAbilitiesAndOptions, getOpUniqueAbilitiesAndOptions, getShortOpTypeName } from '@/lib/utils/utils'
import { WeaponRule } from '@/lib/utils/weaponRules'
import WeaponTable from '@/src/components/shared/WeaponTable'
import { KillteamPlain, OpPlain, OpTypePlain, RosterPlain } from '@/types'
import { Menu, MenuButton } from '@headlessui/react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { useEffect, useState } from 'react'
import { FaHeartPulse } from 'react-icons/fa6'
import { FiEdit, FiMoreVertical, FiPause } from 'react-icons/fi'
import { GiDeathSkull } from 'react-icons/gi'
import { Button, Modal } from '../ui'
import Markdown from '../ui/Markdown'
import OpCardMenu from './OpCardMenu'
import OpEditorModal from './OpEditorModal'

type OpCardProps = {
  op: OpPlain | OpTypePlain
  roster: RosterPlain | null
  seq: number
  isOwner: boolean
  allWeaponRules: WeaponRule[]
  onOpUpdated?: (u: OpPlain) => void
  onMoveUp?: () => void
  onMoveFirst?: () => void
  onMoveDown?: () => void
  onMoveLast?: () => void
  onDelete?: (rosterId: string) => void
  onOpDeleted?: (id: string) => void
  onPortraitClick?: (id: string) => void
  killteam?: KillteamPlain | null
}

export default function OpCard({
  op,
  roster,
  seq,
  isOwner,
  allWeaponRules,
  onOpUpdated,
  onMoveUp,
  onMoveFirst,
  onMoveDown,
  onMoveLast,
  onOpDeleted,
  onPortraitClick,
  killteam,
}: OpCardProps) {
  const { settings } = useLocalSettings()

  const showPortrait = !op.isOpType && op.hasCustomPortrait && settings.showPortraits

  const primaryName = op.isOpType
    ? getShortOpTypeName(op as OpTypePlain)
    : settings.showOpTypeFirst
      ? getShortOpTypeName(op.opType)
      : (op.opName || getShortOpTypeName(op.opType))

  const secondaryName = !op.isOpType
    ? settings.showOpTypeFirst
      ? (op.opName || '')
      : getShortOpTypeName(op.opType)
    : ''

  // Modal visibility states
  const [showWOUNDSModal, setShowWOUNDSModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showOpEditorModal, setShowOpEditorModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [opIsDeployed, setOpIsDeployed] = useState(!op.isOpType && op.isDeployed)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Op state tracking
  const [newCurrWOUNDS, setNewCurrWOUNDS] = useState(!op.isOpType ? op.currWOUNDS : 0)
  
  // Delete state
  const [deleteError, setDeleteError] = useState('')

  // For printing - Get operative unique abilities and options
  const { abilities: opUniqueAbilities, options: opUniqueOptions } = getOpUniqueAbilitiesAndOptions(roster ?? undefined, !op.isOpType && op || undefined)
  const { abilities: opTypeUniqueAbilities, options: opTypeUniqueOptions } = op.isOpType
    ? getOpTypeUniqueAbilitiesAndOptions(killteam ?? roster?.killteam ?? undefined, op as OpTypePlain)
    : { abilities: [], options: [] }

  useEffect(() => {
    !op.isOpType && setNewCurrWOUNDS(op.currWOUNDS ?? 0)
  }, [op.currWOUNDS])

  const showDesc = (title: string, description: string) => {
    showInfoModal({
      title: title,
      body: (
        <div className="prose prose-invert max-w-none">
          <Markdown>
            {description}
          </Markdown>
        </div>
      )
    })
  }

  // Toggle deployment
  const toggleDeploy = async () => {
    if (op.isOpType) return

    const newIsDeployed = !op.isDeployed

    const res = await fetch(`/api/ops/${op.opId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDeployed: newIsDeployed }),
    })

    if (res.ok) {
      const updated = await res.json()
      setOpIsDeployed(updated.isDeployed)
      onOpUpdated?.(updated)
    } else {
      console.error('Failed to update deployment')
    }
  }

  // Notes/description
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [draftNotes, setDraftNotes] = useState(op.isOpType ? '' : op.description ?? '')
  const [savingNotes, setSavingNotes] = useState(false)

  const startEditingNotes = () => {
    if (op.isOpType || !isOwner) return
    setDraftNotes(op.description ?? '')
    setIsEditingNotes(true)
  }

  const saveNotes = async () => {
    if (op.isOpType || !isOwner) return
    try {
      setSavingNotes(true)
      const res = await fetch(`/api/ops/${op.opId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: draftNotes }),
      })
      if (!res.ok) throw new Error('Failed to save notes')
      // Optimistic local update
      op.description = draftNotes
      setIsEditingNotes(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingNotes(false)
    }
  }

  const cancelNotes = () => {
    setIsEditingNotes(false)
    !op.isOpType && setDraftNotes(op.description ?? '')
  }

  const cardClassName = [
    'bg-card border border-main p-1 rounded relative flex flex-col',
    isCollapsed ? 'self-start h-auto' : 'h-full',
    'opcard',
  ].join(' ')

  return (
    <>
      <div className={cardClassName}>
        <div className={'grid grid-cols-4 gap-1 text-center'}>
          {showPortrait && (
            <div className="cursor-pointer col-span-1 border border-muted/50 rounded-md" style={{maxHeight: '100%', maxWidth: '100%', overflow: 'hidden'}} onClick={() => !op.isOpType && onPortraitClick && onPortraitClick(op.opId)}>
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: (!op.isOpType && (op.currWOUNDS == 0 || !op.isDeployed)) ? 'grayscale(1)' : 'none' }}
                src={`${getOpPortraitUrl(op.opId)}?v=${toEpochMs(op.portraitUpdatedAt)}`}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <div className={showPortrait ? 'col-span-3' : 'col-span-4'}>
            {/* Name and Type */}
            <div className="flex justify-between">
              <div className="flex justify-between gap-x-2 text-left overflow-hidden">
                {/* Order */}
                {!op.isOpType && op.currWOUNDS !== 0 && op.isDeployed && (
                  <button className="noprint flex-shrink-0" onClick={() => isOwner && setShowOrderModal(true)} >
                    <img
                      className='w-6 h-6'
                      alt={`${op.opOrder} - ` + (op.isActivated ? 'Activated' : 'Ready')}
                      title={`${op.opOrder} - ` + (op.isActivated ? 'Activated' : 'Ready')}
                      src={`/icons/${op.opOrder}${op.isActivated ? 'White' : 'Orange'}.png`}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )}
                {/* Name */}
                <h5 className={`font-heading truncate ${isOwner ? 'cursor-pointer' : ''} flex items-center gap-1 ${!op.isOpType && (op.currWOUNDS == 0 || !op.isDeployed) ? 'text-muted' : ''}`} onClick={() => setIsCollapsed(!isCollapsed)}>
                  {!op.isOpType && op.isDeployed && (
                    <>{seq}. </>
                  )}
                  {!op.isOpType && !op.isDeployed && (
                    <FiPause />
                  )}

                  <span className="truncate">{primaryName || ''}</span>
                  {!op.isOpType && op.currWOUNDS < (op.WOUNDS / 2) && op.currWOUNDS > 0 && (
                    <FaHeartPulse className="text-base text-muted" /> 
                  )}
                  {!op.isOpType && op.currWOUNDS == 0 && (
                    <GiDeathSkull className="text-base text-muted" /> 
                  )}
                </h5>
              </div>

              {/* Menu */}
              {isOwner && (
                <Menu as="div" className="relative flex-shrink-0 noprint">
                  <MenuButton as="button" className="p-1">
                    <FiMoreVertical className="w-5 h-5" />
                  </MenuButton>
                  <OpCardMenu
                    isDeployed={opIsDeployed}
                    onEdit={() => setShowOpEditorModal(true)}
                    onToggleDeploy={toggleDeploy}
                    onDelete={() => setShowDeleteConfirm(true)}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onMoveFirst={onMoveFirst}
                    onMoveLast={onMoveLast}
                  />
                </Menu>
              )}
            </div>

            {/* Stats */}
            {!op.isOpType && secondaryName && (
              <div className="text-muted text-xs text-left">
                {secondaryName}
              </div>
            )}
            <div className={'grid grid-cols-4 gap-1 text-center'}>
              <h6 className="stat">A <span className="stat text-main text-2xl">{op.APL}</span></h6>
              <h6 className="stat">M <span className="stat text-main text-2xl">{op.MOVE}</span></h6>
              <h6 className="stat">S <span className="stat text-main text-2xl">{op.SAVE}</span></h6>
              {op.isOpType ? (
                <h6 className="stat">W <span className="stat text-main text-2xl">{op.WOUNDS}</span></h6>
              ) : (
                <h6 className="stat cursor-pointer" onClick={() => isOwner && setShowWOUNDSModal(true)}>
                  W
                  { ' ' }
                  <span className="stat text-main text-2xl">{op.currWOUNDS}</span>
                  <span className="stat text-muted text-sm noprint">/{op.WOUNDS}</span>
                </h6>
              )}
            </div>
          </div>
        </div>

        {/* Weapons */}
        {!isCollapsed && (op.weapons?.length ?? 0) > 0 && (op.isOpType || (op.currWOUNDS !== 0 && op.isDeployed)) && (
          <WeaponTable weapons={op.weapons ?? []} allWeaponRules={allWeaponRules} />
        )}

        {/* Abilities */}
        {!isCollapsed && (op.abilities?.length ?? 0) > 0 && (op.isOpType || (op.currWOUNDS !== 0 && op.isDeployed)) && (
          <div className="border-t border-border grid grid-cols-2 mt-2">
            <h6 className="text-muted">Abilities</h6>
            {op.abilities?.map((ability) => (
              <span 
                key={ability.abilityId}
                onClick={() => showDesc(ability.abilityName + (ability.AP ? ` (${ability.AP} AP)` : ''), ability.description)} 
                className="cursor-pointer hover:text-main truncate overflow-hidden mr-2"
              >
                {ability.AP != null && (
                  <span>{ability.AP}AP: </span>
                )}
                {ability.abilityName}
              </span>
            ))}
          </div>
        )}

        {/* Options */}
        {!isCollapsed && (op.options?.length ?? 0) > 0 && (op.isOpType || (op.currWOUNDS !== 0 && op.isDeployed)) && (
          <div className="border-t border-border grid grid-cols-2 mt-2">
            <h6 className="text-muted">Options</h6>
            {op.options?.map((opt) => (
              <span 
                key={opt.optionId}
                onClick={() => showDesc(opt.optionName, opt.description)} 
                className="cursor-pointer hover:text-main truncate overflow-hidden mr-2"
              >
                {opt.optionName}
              </span>
            ))}
          </div>
        )}

        {/* Description/Notes */}
        {!isCollapsed && !op.isOpType && (isOwner || op.description) && op.isDeployed && op.currWOUNDS !== 0  && (
          <div className={`border-t border-border flex flex-col ${op.description ? '' : 'noprint'}`}>
            <h6
              className={`text-muted flex items-center gap-2 ${isOwner ? 'cursor-pointer' : ''}`}
              onClick={isOwner ? startEditingNotes : () => {}}>
              Notes
              {isOwner && !isEditingNotes && (
                <button
                  type="button"
                  className="noprint text-muted hover:text-main"
                  title="Edit notes"
                >
                  <FiEdit />
                </button>
              )}
            </h6>

            {/* View mode (everyone) */}
            {!isEditingNotes && (
              <div
                className={isOwner ? 'cursor-pointer group' : ''}
                onClick={isOwner ? startEditingNotes : undefined}
              >
                {op.description && (
                  <div className="prose prose-invert max-w-none max-h-[150px] overflow-y-auto">
                    <Markdown>{op.description}</Markdown>
                  </div>
                )}
              </div>
            )}

            {/* Edit mode (owner only) */}
            {isEditingNotes && isOwner && (
              <div className="space-y-2">
                <MDEditor
                  value={draftNotes}
                  preview="edit"
                  data-color-mode="dark"
                  onChange={(val) => setDraftNotes(val || '')}
                  style={{ minHeight: 300 }}
                  commands={[
                    commands.bold,
                    commands.italic,
                    commands.hr,
                    commands.divider,
                    commands.quote,
                    commands.unorderedListCommand,
                    commands.orderedListCommand
                  ]}
                />
                <div className="flex items-center gap-2">
                  <Button onClick={saveNotes} disabled={savingNotes} className="flex items-center gap-1">
                    Save
                  </Button>
                  <Button variant="ghost" onClick={cancelNotes} className="flex items-center gap-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Print only - Additional info */}
        <div className="printonly overflow-y-hidden border-t border-border">
          {!op.isOpType && ((opUniqueAbilities.length + opUniqueOptions.length) > 0) && op.isDeployed && (
            <>
              <div className="mt-2 text-sm">
                {opUniqueAbilities.map((ability) => (
                  <Markdown key={`printability_${ability.abilityId}`} className="hideEm">
                    {`**${ability.abilityName}${ability.AP != null ? ` (${ability.AP}AP)` : ''}:** ${ability.description}`}
                  </Markdown>
                ))}
                {opUniqueOptions.map((option) => (
                  <Markdown key={`printoption_${option.optionId}`} className="hideEm">
                    {`**${option.optionName}:** ${option.description}`}
                  </Markdown>
                ))}
              </div>
            </>
          )}
          {op.isOpType && ((opTypeUniqueAbilities.length + opTypeUniqueOptions.length) > 0) && (
            <>
              <div className="mt-2 text-sm">
                {opTypeUniqueAbilities.map((ability) => (
                  <Markdown key={`printoptypeability_${ability.abilityId}`} className="hideEm">
                    {`**${ability.abilityName}${ability.AP != null ? ` (${ability.AP}AP)` : ''}:** ${ability.description}`}
                  </Markdown>
                ))}
                {opTypeUniqueOptions.map((option) => (
                  <Markdown key={`printoptypeoption_${option.optionId}`} className="hideEm">
                    {`**${option.optionName}:** ${option.description}`}
                  </Markdown>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-border mt-auto text-muted text-xs flex items-center justify-between gap-1 uppercase">
            <em>
              {op.isOpType ? op.keywords : op.opType?.keywords}
            </em>
            {(() => {
              const basesize = op.isOpType ? (op as OpTypePlain).basesize : op.opType?.basesize
              return basesize ? (
                <span
                  className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border border-muted normal-case"
                  title={`Base size: ${basesize}mm`}
                >
                  {basesize}
                </span>
              ) : null
            })()}
          </div>
        )}
      </div>

      {/* HIT Modal */}
      {!op.isOpType && showWOUNDSModal && (() => {
        const maxWounds = op.WOUNDS || 0
        const values = Array.from({ length: maxWounds + 1 }, (_, i) => i)
        
        return (
          <Modal title={op.opName || getShortOpTypeName(op.opType) || ''} onClose={() => setShowWOUNDSModal(false)}>
            <div className="grid grid-cols-6 gap-2">
              {/* We have to force WOUNDS as a number here */}
              {values.map(i => (
                <Button
                  key={i}
                  variant={newCurrWOUNDS === i ? 'highlighted' : 'ghost'}
                  className="flex-1 py-2 rounded text-xl flex items-center justify-center stat"
                  onClick={async () => {
                    const res = await fetch(`/api/ops/${op.opId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ currWOUNDS: i }),
                    })

                    if (res.ok) {
                      const updated = await res.json()
                      setNewCurrWOUNDS(updated.currWOUNDS)
                      op.currWOUNDS = updated.currWOUNDS
                      onOpUpdated && onOpUpdated(updated)
                      setShowWOUNDSModal(false)
                    } else {
                      console.error('Failed to update HIT')
                    }
                  }}
                >
                  <span className="stat">{i}</span>
                </Button>
              ))}
            </div>
          </Modal>
        )
      })()}

      
      {/* Order/Activation Modal */}
      {!op.isOpType && showOrderModal && (() => {
        return (
          <Modal title={op.opName || getShortOpTypeName(op.opType) || ''} onClose={() => setShowOrderModal(false)}>
            <div className="grid grid-cols-4 gap-2">
              <button
                key="concealedready"
                className={`flex-1 flex-col text-sm py-2 rounded border border-border flex items-center justify-center ghost ${op.opOrder === 'concealed' && op.isActivated == false ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: false, opOrder: 'concealed' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    !op.isOpType && (op.opOrder = updated.opOrder)
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/concealedOrange.png" className="w-8 h-8" loading="lazy" decoding="async" />
                Concealed<br/>Ready
              </button>
              <button
                key="concealedactivated"
                className={`flex-1 flex-col text-sm py-2 rounded border border-border flex items-center justify-center ghost ${op.opOrder === 'concealed' && op.isActivated == true ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: true, opOrder: 'concealed' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    !op.isOpType && (op.opOrder = updated.opOrder)
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/concealedWhite.png" className="w-8 h-8" loading="lazy" decoding="async" />
                Concealed<br/>Activated
              </button>
              <button
                key="engagedready"
                className={`flex-1 flex-col text-sm py-2 rounded border border-border flex items-center justify-center ghost ${op.opOrder === 'engaged' && op.isActivated == false ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: false, opOrder: 'engaged' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    !op.isOpType && (op.opOrder = updated.opOrder)
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/engagedOrange.png" className="w-8 h-8" loading="lazy" decoding="async" />
                Engaged<br/>Ready
              </button>
              <button
                key="engagedactivated"
                className={`flex-1 flex-col text-sm py-2 rounded border border-border flex items-center justify-center ghost ${op.opOrder === 'engaged' && op.isActivated == true ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: true, opOrder: 'engaged' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    !op.isOpType && (op.opOrder = updated.opOrder)
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/engagedWhite.png" className="w-8 h-8" loading="lazy" decoding="async" />
                Engaged<br/>Activated
              </button>
            </div>
          </Modal>
        )
      })()}

      {/* Editor Modal */}
      {!op.isOpType && showOpEditorModal && (
        <OpEditorModal
          key="editor-modal"
          isOpen={true}
          rosterId={op.rosterId || ''}
          killteamId={op.opType?.killteamId ?? ''}
          op={op}
          onClose={() => setShowOpEditorModal(false)}
          allWeaponRules={allWeaponRules}
          onSave={(updated) => {
            !updated.isOpType && onOpUpdated?.(updated) // Call back to parent
            setShowOpEditorModal(false)
          }}
        />
      )}

      {/* Op Deletion Modal*/}
      {!op.isOpType && showDeleteConfirm && 
        <Modal
          title={`Delete ${op.opName == '' ? op.opName : op.opName}`}
          onClose={() => setShowDeleteConfirm(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                <h6>Cancel</h6>
              </Button>
              <Button
                onClick={async () => {
                  setDeleteError('')
                
                  try {
                    if (!op.opId) {
                      console.error('No opId defined — cannot delete.')
                      return
                    }

                    const res = await fetch(`/api/ops/${op.opId}`, { method: 'DELETE' })
                
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}))
                      throw new Error(body.message || 'Failed to delete op')
                    }

                    onOpDeleted?.(op.opId)
                    setShowDeleteConfirm(false)
                  } catch (err: any) {
                    setDeleteError(err.message || 'Something went wrong')
                  }
                }}
              >
                <h6>Delete</h6>
              </Button>
            </div>
          }
        >
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong>{op.opName == '' ? op.opName : op.opName}</strong>?<br/>
            This cannot be undone.
          </p>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
        </Modal>
      }
    </>
  )
}
