import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import clsx from 'clsx';
import { FiChevronDown, FiChevronsDown, FiChevronsUp, FiChevronUp, FiEdit, FiTrash } from 'react-icons/fi';

export default function OpCardMenu({
  onEdit,
  onDelete,
  onMoveUp,
  onMoveFirst,
  onMoveDown,
  onMoveLast
}: {
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveFirst?: () => void;
  onMoveDown?: () => void;
  onMoveLast?: () => void
}) {
  return (
    <Menu>
      <MenuButton className="p-1 rounded-full hover:bg-border text-main">
        <FiChevronDown className="w-5 h-5" />
      </MenuButton>

      <MenuItems className="absolute right-2 m-1 z-50 w-28 origin-top-right rounded-md bg-card border border-border shadow-md focus:outline-none divide-y divide-border">
        <div className="flex flex-col py-1">
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground' )}
                onClick={onEdit}
              >
                <FiEdit /> Edit
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground' )}
                onClick={onMoveUp}
              >
                <FiChevronUp /> Move Up
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground' )}
                onClick={onMoveFirst}
              >
                <FiChevronsUp /> Move First
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground' )}
                onClick={onMoveDown}
              >
                <FiChevronDown /> Move Down
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground' )}
                onClick={onMoveLast}
              >
                <FiChevronsDown /> Move Last
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button className={clsx('m-1 text-left text-sm w-full flex items-center gap-2', focus ? 'text-main' : 'text-foreground' )}
                onClick={onDelete}
              >
                <FiTrash /> Delete
              </button>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  )
}
