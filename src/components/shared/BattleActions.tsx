'use client'

import { Button, Modal } from '@/components/ui'
import { BattlePlain } from '@/types'
import { useState } from 'react'
import { FiCheck, FiTrash2 } from 'react-icons/fi'
import { toast } from 'sonner'

/*
  Confirm / Dispute / Withdraw, shared by the roster Battles tab and the user
  Battles tab so both read and behave the same. Each tab works out the
  perspective ("is this awaiting me?") its own way - by roster on a roster page,
  by user on a profile - and passes the answer in.
*/

/*
  A battle awaits a user when it is pending and they did not report it. Slot A
  is always the reporter, so that is slot B's owner.
*/
export function isAwaitingUser(battle: BattlePlain, userId: string) {
  return !battle.isConfirmed && battle.rosterB.userId === userId
}

export function useBattleActions({
  onConfirmed,
  onRemoved,
}: {
  onConfirmed: (updated: BattlePlain) => void
  onRemoved: (battleId: number) => void
}) {
  const [removing, setRemoving] = useState<BattlePlain | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const confirm = async (battle: BattlePlain) => {
    setBusyId(battle.battleId)
    try {
      const res = await fetch(`/api/battles/${battle.battleId}/confirm`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
      onConfirmed(await res.json())
      toast.success('Battle confirmed')
    } catch {
      toast.error('Failed to confirm battle')
    } finally {
      setBusyId(null)
    }
  }

  /*
    Disputing (as the opponent) and withdrawing (as the reporter) are the same
    operation on the data - only the wording differs.
  */
  const remove = async (battle: BattlePlain) => {
    setBusyId(battle.battleId)
    try {
      const res = await fetch(`/api/battles/${battle.battleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      onRemoved(battle.battleId)
      toast.success('Battle removed')
    } catch {
      toast.error('Failed to remove battle')
    } finally {
      setBusyId(null)
      setRemoving(null)
    }
  }

  return { busyId, removing, setRemoving, confirm, remove }
}

/*
  Confirm and Dispute are weighted equally - disputing is not an accusation - so
  both are plain icon buttons, distinguished only by the hover colour. Only the
  trash is guarded by a modal: confirming is terminal under rule 5 but is also
  the agreeable outcome, whereas the trash destroys the row for both players.
*/
export function PendingBattleActions({
  awaitingMe,
  busy,
  onConfirm,
  onRemove,
}: {
  awaitingMe: boolean
  busy: boolean
  onConfirm: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1 flex-shrink-0">
      {awaitingMe && (
        <button
          onClick={onConfirm}
          disabled={busy}
          className="text-muted hover:text-green-500 transition-colors p-1 disabled:opacity-40 disabled:hover:text-muted"
          title="Confirm"
          aria-label="Confirm battle"
        >
          <FiCheck />
        </button>
      )}
      <button
        onClick={onRemove}
        disabled={busy}
        className="text-muted hover:text-red-500 transition-colors p-1 disabled:opacity-40 disabled:hover:text-muted"
        title={awaitingMe ? 'Dispute' : 'Withdraw'}
        aria-label={awaitingMe ? 'Dispute battle' : 'Withdraw battle'}
      >
        <FiTrash2 />
      </button>
    </div>
  )
}

export function RemoveBattleModal({
  isDispute,
  busy,
  onCancel,
  onConfirm,
}: {
  isDispute: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      title={isDispute ? 'Dispute this battle?' : 'Withdraw this battle?'}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {isDispute ? 'Dispute' : 'Withdraw'}
          </Button>
        </div>
      }
    >
      <p className="text-sm">
        {isDispute
          ? 'This removes the reported result. It will not count toward either record, and your opponent can report it again.'
          : 'This removes the result you reported. It will not count toward either record.'}
      </p>
    </Modal>
  )
}
