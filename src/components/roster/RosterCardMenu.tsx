import { MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { FiChevronDown, FiChevronsDown, FiChevronsUp, FiChevronUp, FiCopy, FiEdit, FiTrash } from 'react-icons/fi'
import { toast } from 'sonner'

export default function RosterCardMenu({
  rosterId,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveFirst,
  onMoveDown,
  onMoveLast
}: {
  rosterId: string
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveFirst: () => void
  onMoveDown: () => void
  onMoveLast: () => void
}) {

  const router = useRouter()

  const onClone = async () => {
    try {
      const res = await fetch(`/api/rosters/${rosterId}/clone`, {
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
    <MenuItems className="absolute right-0 top-6 m-1 z-50 w-28 origin-top-right rounded-md bg-card border border-border shadow-md focus:outline-none divide-y divide-border">
      <div className="flex flex-col py-1">
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onEdit}
            >
              <FiEdit /> Edit
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onClone}
            >
              <FiCopy /> Clone
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onMoveUp}
            >
              <FiChevronUp /> Move Up
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onMoveFirst}
            >
              <FiChevronsUp /> Move First
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onMoveDown}
            >
              <FiChevronDown /> Move Down
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onMoveLast}
            >
              <FiChevronsDown /> Move Last
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
              onClick={onDelete}
            >
              <FiTrash /> Delete
            </button>
          )}
        </MenuItem>
      </div>
    </MenuItems>
  )
}
