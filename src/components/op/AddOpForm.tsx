
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
  const [showNemesisModal, setShowNemesisModal] = useState(false)
  const { data: session } = useSession()
  const userName = session?.user?.userName

  if (!userName) return null

  return (
    <div className="text-center my-auto noprint">
      <Button onClick={() => setShowAddOpModal(true)}>
        <h6>+ Add Operative</h6>
      </Button>
      <br/><br/>
      <Button onClick={() => setShowNemesisModal(true)} variant="ghost">
        <h6>+ Add Nemesis</h6>
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
            onOpAdded?.(updatedOp)
          }}
        />
      )}
      {showNemesisModal && (
        <OpEditorModal
          key="nemesis-modal"
          isOpen={true}
          rosterId={roster.rosterId}
          killteamId="SPEC-NEM"
          onClose={() => setShowNemesisModal(false)}
          allWeaponRules={allWeaponRules ?? []}
          onSave={(updatedOp) => {
            setShowNemesisModal(false)
            onOpAdded?.(updatedOp)
          }}
        />
      )}
    </div>
  )
}
