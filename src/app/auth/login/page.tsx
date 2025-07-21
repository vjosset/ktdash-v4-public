'use client'

import { Button, Input } from '@/components/ui'
import PageTitle from '@/components/ui/PageTitle'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
{/*
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import { GAME } from '@/lib/config/game_config'

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Log In',
    description: `Log in to your ${GAME.NAME} account.`,
    image: {
      url: '/img/hero01.webp',
    },
    keywords: ['login', 'log in', 'sign in', 'signin', 'account', 'user'],
  })
}
*/}

export default function LogInPage() {
  const [userName, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const res = await signIn('credentials', {
      userName,
      password,
      redirect: false,
    })

    if (res?.ok) {
      router.push('/me')
    } else {
      const message =
        res?.error === 'CredentialsSignin'
          ? 'Invalid userName or password.'
          : 'Something went wrong. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="px-1 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <PageTitle>Log In</PageTitle>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={e => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="flex justify-center">
          <Button onClick={handleLogin} type="submit">
            <h6>Log In</h6>
          </Button>
        </div>

        <div className="text-sm text-center text-muted">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-main underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
