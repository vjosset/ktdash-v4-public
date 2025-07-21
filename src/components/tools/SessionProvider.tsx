'use client'

import { SessionProvider as Provider } from 'next-auth/react'
import type { Session } from 'next-auth'

type Props = {
  children: React.ReactNode
  session?: Session | null
}

export default function SessionProvider({ children, session }: Props) {
  return <Provider session={session}>{children}</Provider>
}
