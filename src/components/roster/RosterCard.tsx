'use client'

import { RosterPlain } from '@/types'
import { Menu, MenuButton } from '@headlessui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { Button, Modal } from '../ui'
import RosterCardMenu from './RosterCardMenu'

type RosterCardProps = {
  roster: RosterPlain
  isOwner: boolean
  onMoveUp: () => void
  onMoveFirst: () => void
  onMoveDown: () => void
  onMoveLast: () => void
  onDelete?: (rosterId: string) => void
}

export default function RosterCard({
  roster,
  isOwner,
  onMoveUp,
  onMoveFirst,
  onMoveDown,
  onMoveLast,
  onDelete
}: RosterCardProps) {
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()
  
  return (
    <>
      <div className="group grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] bg-card border border-border rounded hover:border-main transition h-[120px]" key={roster.rosterId}>
        {/* Image section - left side */}
        <Link href={`/rosters/${roster.rosterId}`} className="relative">
          <div 
            className="absolute inset-0 border-r border-border bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
            style={{
              backgroundImage: 
              roster.hasCustomPortrait
                ? `url(/uploads/user_${roster.userId}/roster_${roster.rosterId}/roster_${roster.rosterId}.jpg)`
                : `url(/img/killteams/${roster.killteamId}.jpg)`
            }}
          />
        </Link>

        {/* Content section - right side */}
        <div className="relative px-3 py-2 flex flex-col justify-between">
          <div className="flex items-center">
            <Link href={`/rosters/${roster.rosterId}`} className="flex items-center min-w-0 flex-1">
              <h5 className="font-heading text-main">
                {roster.rosterName}
              </h5>
            </Link>
            {/* Action menu */}
            {isOwner && (
              <Menu>
                <MenuButton as="div">
                  <button className='p-1 rounded-sm transition-colors'>
                    <FiChevronDown className="w-5 h-5" />
                  </button>
                </MenuButton>
                <RosterCardMenu
                  rosterId={roster.rosterId}
                  onEdit={() => router.push(`/rosters/${roster.rosterId}`)}
                  onDelete={() => setShowDeleteConfirm(true)}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onMoveFirst={onMoveFirst}
                  onMoveLast={onMoveLast}
                />
              </Menu>
            )}
          </div>
          <Link href={`/rosters/${roster.rosterId}`}>
            <p className="text-sm">
              <span className="text-gray-500">{roster.killteam?.killteamName || 'missing'}</span>
            </p>
          </Link>
        </div>
      </div>
      
      {/* Roster Deletion Modal*/}
      {showDeleteConfirm && 
        <Modal
          title={`Delete ${roster.rosterName}`}
          onClose={() => setShowDeleteConfirm(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                <h6>Cancel</h6>
              </Button>
              <Button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError('')
                
                  try {
                    const res = await fetch(`/api/rosters/${roster.rosterId}`, { method: 'DELETE' })
                
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}))
                      throw new Error(body.message || 'Failed to delete roster')
                    }
                    setShowDeleteConfirm(false)
                    if (onDelete) onDelete(roster.rosterId) // <-- Add this line
                  } catch (err: any) {
                    setDeleteError(err.message || 'Something went wrong')
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                <h6>{deleting ? 'Deleting...' : 'Delete'}</h6>
              </Button>
            </div>
          }
        >
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong>{roster.rosterName}</strong>?<br/>
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
