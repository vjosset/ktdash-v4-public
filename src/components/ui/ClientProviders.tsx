'use client'

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { Tracker } from './Tracker'

type Props = {
  children: React.ReactNode
  session: Session | null
}

export function ClientProviders({ children, session }: Props) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster
        richColors={false}
        position="bottom-center"
        toastOptions={{
          duration: 1500,
          classNames: {
            toast: '!max-w-[90vw] !sm:max-w-sm !bg-background !text-foreground !text-semibold !border-2 !border-main',
            icon: '!text-main'
          }
        }}
      />
      <Tracker />
    </SessionProvider>
  )
}
