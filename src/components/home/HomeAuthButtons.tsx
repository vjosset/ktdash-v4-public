'use client'

import { Button } from '@/components/ui'
import { useSession } from 'next-auth/react'

export default function HomeAuthButtons() {

  const { data: session } = useSession()

  // If user is logged in, don't show auth buttons
  if (session && session.user) return null

  return (
    <div className="flex justify-center gap-4 mt-8">
      <a href="/auth/signup">
        <Button><h6>Sign Up</h6></Button>
      </a>
      <a href="/auth/login">
        <Button><h6>Log In</h6></Button>
      </a>
    </div>
  )
}
