import { MenuItem, MenuItems } from '@headlessui/react'
import clsx from 'clsx'
import { FiChevronDown, FiChevronsDown, FiChevronsUp, FiChevronUp, FiEdit, FiPause, FiPlay, FiTrash } from 'react-icons/fi'

export default function OpCardMenu({
  isDeployed,
  onEdit,
  onToggleDeploy,
  onDelete,
  onMoveUp,
  onMoveFirst,
  onMoveDown,
  onMoveLast
}: {
  isDeployed: boolean
  onEdit: () => void
  onToggleDeploy: () => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveFirst?: () => void
  onMoveDown?: () => void
  onMoveLast?: () => void
}) {
  return (
    <MenuItems anchor="bottom end" className="noprint m-1 z-50 w-64 origin-top-right rounded-md bg-card border border-main focus:outline-none divide-y divide-border">
      <div className="grid grid-cols-2 gap-1 p-1">
        {/* Left column: Move actions */}
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

        {/* Right column: General actions */}
        <div className="flex flex-col space-y-1">
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                onClick={onEdit}
              >
                <FiEdit /> Edit
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                onClick={onToggleDeploy}
              >
                {isDeployed ? <><FiPause /> Reserve</> : <><FiPlay /> Deploy</>}
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground')}
                onClick={onDelete}
              >
                <FiTrash /> Delete
              </button>
            )}
          </MenuItem>
        </div>
      </div>
    </MenuItems>
  )
}
