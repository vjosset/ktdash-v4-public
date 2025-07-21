/*
  General purpose "Info" modal. Only supports one open modal at a time.
*/

'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Button } from '.'
import { FiX } from 'react-icons/fi'

type ModalConfig = {
  title: string
  body: ReactNode
  footer?: ReactNode
}

type ModalContextType = {
  showModal: (config: ModalConfig) => void
  hideModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null)

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  const showModal = (config: ModalConfig) => {
    setModalConfig(config)
    setIsOpen(true)
  }

  const hideModal = () => {
    setIsOpen(false)
  }

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      {isOpen && modalConfig && (
        <div
          className="z-50 fixed inset-0 bg-black/60 flex items-center justify-center"
          onClick={hideModal} // Close on backdrop click
        >
          <div
            className="bg-background text-foreground rounded-lg shadow-lg max-w-md w-full border border-border relative flex flex-col max-h-[90vh] p-1"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing
          >
            <div className="flex items-center justify-between px-2 border-b border-border sticky top-0 bg-background z-10">
              <h4 className="text-main font-bold font-heading">{modalConfig.title}</h4>
              <button
                className="text-muted hover:text-main w-8 h-8 flex items-center justify-center"
                onClick={hideModal}
                aria-label="Close modal"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <div className="text-foreground overflow-y-auto px-2 ">
              {modalConfig.body}
            </div>
            {modalConfig.footer ?? (
              <div className="p-2 border-t border-border sticky bg-background z-10">
                <Button
                  onClick={hideModal}
                >
                  <h6>Close</h6>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}
