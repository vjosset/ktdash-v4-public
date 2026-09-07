'use client'

import { getRosterPortraitUrl } from '@/lib/utils/imageUrls'
import { RosterPlain } from '@/types'
import { Menu, MenuButton } from '@headlessui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FiDownload, FiEye, FiMoreVertical, FiStar } from 'react-icons/fi'
import { KillteamLink, UserLink } from '../shared/Links'
import { Button, Modal } from '../ui'
import RosterCardMenu from './RosterCardMenu'

type RosterCardProps = {
  roster: RosterPlain
  isOwner: boolean
  showUser: boolean
  showKillteam: boolean
  onMoveUp?: () => void
  onMoveFirst?: () => void
  onMoveDown?: () => void
  onMoveLast?: () => void
  onDelete?: (rosterId: string) => void
}

export default function RosterCard({
  roster,
  isOwner,
  showUser,
  showKillteam,
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
      <div className="group grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] bg-card border border-border rounded hover:border-main transition min-h-[120px]" key={roster.rosterId}>
        {/* Image section - left side */}
        <Link href={`/rosters/${roster.rosterId}`} className="relative overflow-hidden">
          <div 
            className="absolute inset-0 border-r border-border bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
            style={{
              backgroundImage:
                roster.hasCustomPortrait
                  ? `url(${getRosterPortraitUrl(roster.rosterId)})`
                  : (roster.killteam?.isHomebrew && roster.killteam?.userId
                      ? `url(/api/killteams/${roster.killteamId}/portrait?thumb=1)`
                      : `url(/img/killteams/${roster.killteamId}_thumb.webp)`)
            }}
          />
        </Link>
        
        {/* Content section - right side */}
        <div className="relative px-3 py-2 flex flex-col justify-between h-full min-w-0">
          {/* Top row: name + menu */}
          <div className="flex items-start gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <Link
                href={`/rosters/${roster.rosterId}`}
                className="block overflow-hidden"
              >
                <h6 className="font-heading text-main truncate leading-snug whitespace-nowrap">
                  {roster.rosterName}
                </h6>
              </Link>
            </div>
            {isOwner && (
              <Menu as="div" className="relative flex-shrink-0 noprint">
                <MenuButton as="button" className="p-1">
                  <FiMoreVertical className="w-5 h-5" />
                </MenuButton>
                <RosterCardMenu
                  roster={roster}
                  isOwner={isOwner}
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

          {/* Stats row */}
          <div className="flex items-center gap-3 text-sm mt-1">
            {roster.isSpotlight && (
              <div className="flex items-center gap-1" title="Roster is spotlighted">
                <FiStar />
              </div>
            )}
            {roster.viewCount > 0 && (
              <div className="flex items-center gap-1" title="Total Views">
                <FiEye />
                <span>{roster.viewCount?.toLocaleString() ?? 0}</span>
              </div>
            )}
            {roster.importCount > 0 && (
              <div className="flex items-center gap-1" title="Total Imports">
                <FiDownload />
                <span>{roster.importCount?.toLocaleString() ?? 0}</span>
              </div>
            )}
          </div>

          {/* Killteam + User */}
          <div className="text-sm text-muted break-words leading-snug mt-1">
            {showKillteam && roster.killteam &&
              <KillteamLink 
                killteam={roster.killteam}
              />
            }
            {showUser && showKillteam && (
              <span>{' '}by{' '}</span>
            )}
            {showUser && (
              <UserLink userName={roster.user?.userName ?? 'Unknown'} />
            )}
          </div>
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
