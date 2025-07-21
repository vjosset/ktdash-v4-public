/*
  Portal Modal - Used by OpEditorForm and HITModal
*/
'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

export default function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
}) {
  // Prevent background scrolling
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-background text-foreground rounded-lg shadow-lg max-w-md w-full border border-border relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border sticky top-0 bg-background z-10">
          <h4 className="text-main font-bold font-heading">{title}</h4>
          <button
            className="text-muted hover:text-main w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-2 flex-1">
          {children}
        </div>

        {/* Optional Footer (e.g. Save button) */}
        {footer &&
          <div className="p-2 border-t border-border sticky bottom-0 bg-background z-10">
            {footer}
          </div>
        }
      </div>
    </div>,
    document.body
  )
}
