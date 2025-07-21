'use client'

import KillteamInfo from '@/components/killteam/KillteamInfo';
import AddOpForm from '@/components/op/AddOpForm';
import OpCard from '@/components/op/OpCard';
import EditRosterForm from '@/components/roster/EditRosterForm';
import { KillteamLink, UserLink } from '@/components/shared/Links';
import { Button, Modal } from '@/components/ui';
import CarouselModal, { CarouselItem } from '@/components/ui/CarouselModal';
import PageTitle from '@/components/ui/PageTitle';
import { showInfoModal } from '@/lib/utils/showInfoModal';
import { WeaponRule } from '@/lib/utils/weaponRules';
import { OpPlain, RosterPlain } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FiDownload, FiEdit2, FiInfo, FiRotateCcw } from 'react-icons/fi';
import { toast } from 'sonner';

export default function RosterPageClient({
  initialRoster,
  isOwner,
}: {
  initialRoster: RosterPlain
  isOwner: boolean
}) {
  const router = useRouter()
  const { status } = useSession()

  const [ops, setOps] = useState<OpPlain[]>(initialRoster.ops ?? [])
  const [roster, setRoster] = useState(initialRoster)
  const [allWeaponRules, setSpecials] = useState<WeaponRule[] | null>(null)
  const formRef = useRef<{ handleSubmit: () => void }>(null)
  const [showResetModal, setShowResetModal] = useState<Boolean>(false)
  const [showEditRosterModal, setShowEditRosterModal] = useState<Boolean>(false)
  const [carouselIsOpen, setCarouselIsOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  useEffect(() => {
    fetch('/api/specials')
      .then(res => res.json())
      .then(data => setSpecials(data))
      .catch(err => console.error('Failed to fetch specials', err))
  }, [])

  useEffect(() => {
    setOps(roster.ops ?? [])
  }, [roster.ops])

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
  
  const updateRosterInfo = async (name: string) => {
    const res = await fetch(`/api/rosters/${roster.rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        rosterName: name
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

  const handleEditRosterClick = () => { setShowEditRosterModal(true)}

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

  // Move op at index to newIndex
  const moveOp = async(from: number, to: number) => {
    if (to < 0 || to >= ops.length) return
    const newOps = [...ops]
    const [moved] = newOps.splice(from, 1)
    newOps.splice(to, 0, moved)
    setOps(newOps)

    await updateOpSeqs(newOps)
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

  const carouselItems: CarouselItem[] = [];
  if (roster.hasCustomPortrait) {
    carouselItems.push({title: roster.rosterName, imageUrl: `/uploads/user_${roster?.userId}/roster_${roster.rosterId}/roster_${roster.rosterId}.jpg` })
  }
  roster.ops?.filter(op => op.hasCustomPortrait).map(op => op.hasCustomPortrait && carouselItems.push({title: op.opName, imageUrl: `/uploads/user_${roster?.userId}/roster_${op.rosterId}/op_${op.opId}.jpg?v=${op.updatedAt}`}));

  const handlePortraitClick = (clickedUrl: string) => {
    const index = carouselItems.findIndex(item => item.imageUrl === clickedUrl);
    if (index >= 0) {
      setCarouselStartIndex(index);
      setCarouselIsOpen(true);
    }
  };

  return (
    <div>
      <div className="text-center space-y-2 mb-1">
        <div className="flex flex-col justify-center items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <PageTitle onClick={handleEditRosterClick}>
              {roster.rosterName}
            </PageTitle>
            {isOwner && (
              <sup 
                className="text-sm flex items-center w-6 h-6 jutify-top cursor-pointer"
                onClick={handleEditRosterClick}
                aria-label="Edit roster info"
              >
                <FiEdit2/>
              </sup>
            )}
          </div>

          {/* Details under title */}
          <div className="flex items-center justify-center gap-2 text-muted">
            <KillteamLink
              killteamId={roster.killteamId}
              killteamName={roster.killteam?.killteamName || 'Unknown Killteam'}
            />
            <span>by</span>
            <UserLink userName={roster.user?.userName || 'Unknown User'} />
            
            {!isOwner && status === 'authenticated' && (
              <Button
                className="cursor-pointer items-center p-0"
                title="Import this Squad to your Squads"
                aria-label="Import this squad"
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
                    toast.error('Could not import squad')
                  }
                }}>
                <FiDownload /> Import
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trackers */}
      {isOwner && (
        <div className="sticky top-0 lg:top-[3.5rem] max-w-xl mx-auto z-10 bg-background py-2 px-1 flex gap-2 items-center justify-between">
          {[
            { label: 'TURN', key: 'turn' },
            { label: 'VP', key: 'VP' },
            { label: 'CP', key: 'CP' },
          ].map(({ label, key }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <h6 className="font-bold text-main">{label}:</h6>
              <div className="flex items-center">
                <button
                  className="flex items-center justify-center rounded border border-border w-6 h-6 text-lg"
                  onClick={() => updateRosterField(key, roster[key as 'turn' | 'VP' | 'CP'] - 1)}
                >−</button>
                <h4 className="stat w-7 text-center">{roster[key as 'turn' | 'VP' | 'CP']}</h4>
                <button
                  className="flex items-center justify-center rounded border border-border w-6 h-6 text-lg"
                  onClick={() => updateRosterField(key, roster[key as 'turn' | 'VP' | 'CP'] + 1)}
                >+</button>
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
                <button 
                  className="flex items-center justify-center rounded border border-border w-6 h-6"
                  onClick={() => showInfoModal({
                    title: roster.rosterName,
                    body: (
                      <div className="overflow-y-auto p-2 flex-1">
                        <KillteamInfo
                          killteam={roster.killteam}
                          roster={roster}
                          onRosterUpdate={(updated) => setRoster(updated)} />
                      </div>
                    )
                  })}
                  aria-label="Tools"
                >
                  <FiInfo/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OpCards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ops.map((op, idx) => {
          return (
            <OpCard
              key={op.opId}
              seq={idx + 1}
              op={op}
              roster={roster}
              isOwner={isOwner}
              allWeaponRules={allWeaponRules ?? []}
              onOpUpdated={updateOp}
              onOpDeleted={deleteOp}
              onMoveUp={isOwner ? () => moveOp(idx, idx - 1) : () => {}}
              onMoveDown={isOwner ? () => moveOp(idx, idx + 1) : () => {}}
              onMoveFirst={isOwner ? () => moveOp(idx, 0) : () => {}}
              onMoveLast={isOwner ? () => moveOp(idx, ops.length - 1) : () => {}}
              onPortraitClick={() => handlePortraitClick(`/uploads/user_${roster?.userId}/roster_${op.rosterId}/op_${op.opId}.jpg?v=${op.updatedAt}`)}
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

        <CarouselModal
          items={carouselItems}
          initialIndex={carouselStartIndex}
          isOpen={carouselIsOpen}
          onClose={() => setCarouselIsOpen(false)}
        />
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
            initialName={roster.rosterName}
            onSubmit={(name) => {
              updateRosterInfo(name)
              setShowEditRosterModal(false)
            }}
            onCancel={() => setShowEditRosterModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
