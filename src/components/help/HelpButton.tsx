'use client'

import UserHelpContent from '@/components/help/UserHelpContent'
import Modal from '@/components/ui/Modal'
import { useEffect, useState } from 'react'
import { FiHelpCircle } from 'react-icons/fi'

export default function HelpButton({ autoOpen = false }: { autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (autoOpen) setIsOpen(true)
  }, [autoOpen])

  return (
    <>
      <button
        className="text-muted hover:text-main transition-colors"
        title="Help"
        onClick={() => setIsOpen(true)}
        aria-label="Help"
      >
        <FiHelpCircle size={20} />
      </button>

      {isOpen && (
        <Modal title="Your Rosters" onClose={() => setIsOpen(false)}>
          <UserHelpContent />
        </Modal>
      )}
    </>
  )
}
