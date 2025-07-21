'use client'

import Modal from '@/components/ui/Modal'
import React from 'react'
import { createRoot } from 'react-dom/client'

export function showInfoModal({
  title,
  body,
  footer
}: {
  title: string,
  body: React.ReactNode,
  footer?: React.ReactNode
}
) {
  if (typeof window === 'undefined') return // SSR guard

  const container = document.createElement('div')
  document.body.appendChild(container)

  const root = createRoot(container)

  const handleClose = () => {
    root.unmount()
    container.remove()
  }

  // Defer render to next tick to ensure DOM is stable
  root.render(
    <Modal title={title} onClose={handleClose} footer={footer}>
      {body}
    </Modal>
  )
}
