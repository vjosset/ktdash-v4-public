'use client'

import { showInfoModal } from '@/lib/utils/showInfoModal'
import { getShortOpTypeName } from '@/lib/utils/utils'
import { WeaponRule } from '@/lib/utils/weaponRules'
import WeaponTable from '@/src/components/shared/WeaponTable'
import { OpPlain, OpTypePlain, RosterPlain } from '@/types'
import { useEffect, useState } from 'react'
import { FaHeartPulse } from 'react-icons/fa6'
import { GiDeathSkull } from 'react-icons/gi'
import { Button, Modal } from '../ui'
import Markdown from '../ui/Markdown'
import OpCardMenu from './OpCardMenu'
import OpEditorModal from './OpEditorModal'

type OpCardProps = {
  op: OpPlain | OpTypePlain
  roster: RosterPlain | null
  seq: Number
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
}: OpCardProps) {
  // Modal visibility states
  const [showWOUNDSModal, setShowWOUNDSModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showOpEditorModal, setShowOpEditorModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Op state tracking
  const [newCurrWOUNDS, setNewCurrWOUNDS] = useState(!op.isOpType ? op.currWOUNDS : 0)
  
  // Delete state
  const [deleteError, setDeleteError] = useState('')

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

  return (
    <>
      <div className="bg-card border border-main p-1 rounded shadow-inner backdrop-blur relative flex flex-col h-full">
        <div className={`grid grid-cols-4 gap-1 text-center`}>
          {!op.isOpType && op.hasCustomPortrait && (
            <div className="col-span-1 border border-muted/50 rounded-md" style={{maxHeight: '100%', maxWidth: '100%', overflow: 'hidden'}} onClick={() => onPortraitClick && onPortraitClick(op.opId)}>
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: (!op.isOpType && op.currWOUNDS == 0) ? 'grayscale(1)' : 'none' }}
                src={`/uploads/user_${roster?.userId}/roster_${op.rosterId}/op_${op.opId}.jpg?v=${op.updatedAt}`}
                />
            </div>
          )}
          <div className={(!op.isOpType && op.hasCustomPortrait) ? 'col-span-3' : 'col-span-4'}>
            {/* Name and Type */}
            <div className="flex justify-between">
              <div className="flex justify-between gap-x-2 text-left">
                {/* Order */}
                {isOwner && !op.isOpType && op.currWOUNDS !== 0 && (
                  <button onClick={() => isOwner && setShowOrderModal(true)} >
                    <img
                      className='w-6 h-6'
                      alt={`${op.opOrder} - ` + (op.isActivated ? 'Activated' : 'Ready')}
                      title={`${op.opOrder} - ` + (op.isActivated ? 'Activated' : 'Ready')}
                      src={`/icons/${op.opOrder}${op.isActivated ? 'White' : 'Orange'}.png`}
                      />
                  </button>
                )}
                {/* Name */}
                <h5 className={`font-heading ${isOwner ? 'cursor-pointer' : ''} flex items-center gap-1 ${!op.isOpType && op.currWOUNDS == 0 ? 'text-muted' : ''}`} onClick={isOwner ? () => setShowOpEditorModal(true) : () => {}}>
                  {op.isOpType ? '' : `${seq}. `}
                  {(op.isOpType ? getShortOpTypeName(op.opTypeName) : (op.opName || getShortOpTypeName(op.opType?.opTypeName))) || ''}
                  {!op.isOpType && op.currWOUNDS < (op.WOUNDS / 2) && op.currWOUNDS > 0 && (
                    <FaHeartPulse className="text-base text-muted" /> 
                  )}
                  {!op.isOpType && op.currWOUNDS == 0 && (
                    <GiDeathSkull className="text-base text-muted" /> 
                  )}
                </h5>
              </div>
              {/* Menu */}
              <div className="text-muted mb-1">
                {!op.isOpType && isOwner && (
                  <OpCardMenu
                    onEdit={() => setShowOpEditorModal(true)}
                    onDelete={() => setShowDeleteConfirm(true)}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onMoveFirst={onMoveFirst}
                    onMoveLast={onMoveLast}
                  />
                )}
              </div>
            </div>

            {/* Stats */}
            {!op.isOpType && (
              <div className="text-muted text-xs text-left">
                {getShortOpTypeName(op.opType?.opTypeName)}
              </div>
            )}
            <div className={`grid grid-cols-4 gap-1 text-center`}>
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
                  <span className="stat text-muted text-sm">/{op.WOUNDS}</span>
                </h6>
              )}
            </div>
          </div>
        </div>

        {/* Weapons */}
        {(op.weapons?.length ?? 0) > 0 && (op.isOpType || op.currWOUNDS !== 0) && (
          <WeaponTable weapons={op.weapons ?? []} allWeaponRules={allWeaponRules} />
        )}

        {/* Abilities */}
        {(op.abilities?.length ?? 0) > 0 && (op.isOpType || op.currWOUNDS !== 0) && (
          <div className="border-t border-border grid grid-cols-2 gap-x-2 mt-2">
            <h6 className="text-muted">Abilities</h6>
            {op.abilities?.map((ability) => (
              <span 
                key={ability.abilityId}
                onClick={() => showDesc(ability.abilityName + (ability.AP ? ` (${ability.AP} AP)` : ''), ability.description)} 
                className="hastip cursor-pointer hover:text-main"
              >
                {ability.abilityName} {ability.AP ? `(${ability.AP} AP)` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Options */}
        {(op.options?.length ?? 0) > 0 && (op.isOpType || op.currWOUNDS !== 0) && (
          <div className="border-t border-border grid grid-cols-2 gap-x-2 mt-2">
            <h6 className="text-muted">Options</h6>
            {op.options?.map((opt) => (
              <span 
                key={opt.optionId}
                onClick={() => showDesc(opt.optionName, opt.description)} 
                className="hastip cursor-pointer hover:text-main"
              >
                {opt.optionName}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        {(
          <div className="border-t border-border mt-auto text-muted text-xs flex flex-col gap-1">
            <em>
              {op.isOpType ? op.keywords : op.opType?.keywords}
            </em>
          </div>
        )}
      </div>

      {/* HIT Modal */}
      {!op.isOpType && showWOUNDSModal && (() => {
        const maxWounds = Number(op.WOUNDS) || 0
        const values = Array.from({ length: maxWounds + 1 }, (_, i) => i)
        
        return (
          <Modal title={op.opName || getShortOpTypeName(op.opType?.opTypeName) || ''} onClose={() => setShowWOUNDSModal(false)}>
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
          <Modal title={op.opName || getShortOpTypeName(op.opType?.opTypeName) || ''} onClose={() => setShowOrderModal(false)}>
            <div className="grid grid-cols-4 gap-2">
              <Button
                key="concealedready"
                variant="ghost"
                className={`flex-1 py-2 rounded text-xl flex items-center justify-center ghost stat ${op.opOrder === 'concealed' && op.isActivated == false ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: false, opOrder: 'concealed' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    op.opOrder = updated.opOrder
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/concealedOrange.png" className="w-8 h-8" />
              </Button>
              <Button
                key="concealedactivated"
                variant="ghost"
                className={`flex-1 py-2 rounded text-xl flex items-center justify-center stat ghost ${op.opOrder === 'concealed' && op.isActivated == true ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: true, opOrder: 'concealed' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    op.opOrder = updated.opOrder
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/concealedWhite.png" className="w-8 h-8" />
              </Button>
              <Button
                key="engagedready"
                variant="ghost"
                className={`flex-1 py-2 rounded text-xl flex items-center justify-center stat ghost ${op.opOrder === 'engaged' && op.isActivated == false ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: false, opOrder: 'engaged' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    op.opOrder = updated.opOrder
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/engagedOrange.png" className="w-8 h-8" />
              </Button>
              <Button
                key="engagedactivated"
                variant="ghost"
                className={`flex-1 py-2 rounded text-xl flex items-center justify-center stat ghost ${op.opOrder === 'engaged' && op.isActivated == true ? 'border-main' : ''}`}
                onClick={async () => {
                  const res = await fetch(`/api/ops/${op.opId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActivated: true, opOrder: 'engaged' }),
                  })

                  if (res.ok) {
                    const updated = await res.json()
                    op.isActivated = updated.isActivated
                    op.opOrder = updated.opOrder
                    setShowOrderModal(false)
                  } else {
                    console.error('Failed to update order/activation')
                  }
                }}
              >
                <img src="/icons/engagedWhite.png" className="w-8 h-8" />
              </Button>
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
