'use client'

import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { FiX } from 'react-icons/fi'

interface ImageModalProps {
  src: string
  alt: string
  className?: string
}

export default function ImageModal({ src, alt, className }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <img 
        src={src} 
        alt={alt}
        className={`cursor-pointer hover:opacity-90 ${className || ''}`}
        onClick={() => setIsOpen(true)}
      />

      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-4 -right-4 rounded-full bg-background p-2 hover:bg-card"
            >
              <FiX className="h-6 w-6" />
            </button>
            <img 
              src={src} 
              alt={alt}
              className="max-h-[90vh] w-auto"
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}