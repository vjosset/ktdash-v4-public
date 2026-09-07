import { GAME } from '@/lib/config/game_config'
import { showInfoModal } from '@/lib/utils/showInfoModal'
import { RosterPlain } from '@/types'
import { MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { FiChevronDown, FiChevronsDown, FiChevronsUp, FiChevronUp, FiCopy, FiEdit, FiPrinter, FiShare2, FiTrash } from 'react-icons/fi'
import { toast } from 'sonner'
import Button from '../ui/Button'

export default function RosterCardMenu({
  roster,
  isOwner,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveFirst,
  onMoveDown,
  onMoveLast,
  onPrint
}: {
  roster: RosterPlain
  isOwner: boolean
  onEdit?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveFirst?: () => void
  onMoveDown?: () => void
  onMoveLast?: () => void
  onPrint?: () => void
}) {

  const router = useRouter()
  const showMoveCol = !!(onMoveUp || onMoveFirst || onMoveDown || onMoveLast)

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: roster.rosterName || roster.killteam?.killteamName,
        text: roster.description || `A ${roster.killteam?.killteamName} by ${roster.user?.userName}`,
        url: `/rosters/${roster.rosterId}`,
      })
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  const onClone = async () => {
    toast.info('Cloning...')
    try {
      const res = await fetch(`/api/rosters/${roster.rosterId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!res.ok) throw new Error('Failed to create roster')

      const newRosterId = (await res.json()).rosterId
      toast.success('Roster cloned, redirecting...')
      setTimeout(() => router.push(`/rosters/${newRosterId}`), 500)
    } catch (err) {
      console.error(err)
      toast.success('Failed to clone Roster')
    }
  }

  return (
    <MenuItems anchor="bottom end" className={`noprint m-1 z-50 ${showMoveCol ? 'w-64' : 'w-32'} origin-top-right rounded-md bg-card border border-main focus:outline-none divide-y divide-border`}>
      <div className={`grid ${showMoveCol ? 'grid-cols-2' : 'grid-cols-1'} gap-1 p-1`}>
        {/* Left Column: Move Actions (only if any provided) */}
        {isOwner && showMoveCol && (
          <div className="flex flex-col space-y-1">
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onMoveUp}
                >
                  <FiChevronUp /> Move Up
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onMoveFirst}
                >
                  <FiChevronsUp /> Move to Top
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onMoveDown}
                >
                  <FiChevronDown /> Move Down
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onMoveLast}
                >
                  <FiChevronsDown /> Move to Bottom
                </button>
              )}
            </MenuItem>
          </div>
        )}
        
        {/* Right Column: General Actions */}
        <div className="flex flex-col space-y-1">
          {isOwner && onEdit && 
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onEdit}
                >
                  <FiEdit /> Edit
                </button>
              )}
            </MenuItem>
          }
          {onClone &&
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onClone}
                >
                  <FiCopy /> Clone
                </button>
              )}
            </MenuItem>
          }
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                onClick={() => {
                  typeof navigator !== 'undefined' && typeof navigator.share === 'function' && handleNativeShare()
                  showInfoModal({
                    title: `Share - ${roster.rosterName}`,
                    body:
                    <div className="flex flex-col items-start gap-2">
                      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                        <Button onClick={handleNativeShare} className="flex">
                          <FiShare2/ > Share
                        </Button>
                      )}
                      <strong>RosterID:</strong> <pre className="text-2xl">{roster.rosterId}</pre>
                      <br />
                      <strong>Roster Link:</strong>{' '}
                      <Link href={`/rosters/${roster.rosterId}`}>{GAME.ROOT_URL}/rosters/{roster.rosterId}</Link>
                      <br /><br />
                      <div className="mx-auto flex justify-center">
                        <div className="p-4 bg-white rounded">
                          <QRCodeSVG value={`${GAME.ROOT_URL}/rosters/${roster.rosterId}`} size={128} />
                        </div>
                      </div>
                    </div>
                  })
                }}
              >
                <FiShare2 /> Share
              </button>
            )}
          </MenuItem>
          {onPrint &&
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onPrint}
                >
                  <FiPrinter /> Print
                </button>
              )}
            </MenuItem>
          }
          {isOwner && onDelete &&
            <MenuItem>
              {({ focus }) => (
                <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                  onClick={onDelete}
                >
                  <FiTrash /> Delete
                </button>
              )}
            </MenuItem>
          }
        </div>
      </div>
    </MenuItems>
  )
}
