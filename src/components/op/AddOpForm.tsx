
'use client'

import { WeaponRule } from '@/lib/utils/weaponRules'
import { OpPlain } from '@/types/op.model'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '../ui'
import OpEditorModal from './OpEditorModal'

type AddOpFormProps = {
  roster: {
    rosterId: string
    killteamId: string
    rosterName: string
  }
  allWeaponRules: WeaponRule[]
  onOpAdded?: (newOp: OpPlain) => void
}

export default function AddOpForm({ roster: roster, onOpAdded, allWeaponRules }: AddOpFormProps) {
  const [showAddOpModal, setShowAddOpModal] = useState(false)
  const { data: session } = useSession()
  const userName = session?.user?.userName

  if (!userName) return null

  return (
    <div className="text-center my-auto">
      <Button onClick={() => setShowAddOpModal(true)}>
        <h6>+ Add Operative</h6>
      </Button>
      {showAddOpModal && (
        <OpEditorModal
          key="op-modal"
          isOpen={true}
          rosterId={roster.rosterId}
          killteamId={roster.killteamId}
          onClose={() => setShowAddOpModal(false)}
          allWeaponRules={allWeaponRules ?? []}
          onSave={(updatedOp) => {
            setShowAddOpModal(false)
            onOpAdded?.(updatedOp) // ✅ call parent with the new op
          }}
        />
      )}
    </div>
  )
}
