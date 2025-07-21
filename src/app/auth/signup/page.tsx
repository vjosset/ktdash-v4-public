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
    title: 'Sign Up',
    description: `Sign up to your ${GAME.NAME} account to manage your rosters and track stats.`,
    image: {
      url: '/img/hero01.webp',
    },
    keywords: ['sign up', 'singup', 'login', 'log in', 'sign in', 'signin', 'account', 'user'],
  })
}
*/}

export default function SignUpPage() {
  const router = useRouter()

  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (userName.length < 3) {
      setError('User name must be at least 4 characters long.')
      return
    }

    if (userName.includes('@')) {
      setError('User name cannot contain \'@\'. Please do not use your email address as a username.')
    }
  
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ userName, password }),
    })

    if (res.ok) {
      // Auto sign-in immediately after account creation
      const result = await signIn('credentials', {
        redirect: false,
        userName,
        password,
      })
  
      if (result?.ok) {
        router.push('/me')
      } else {
        setError('Sign in failed after registration.')
      }
    } else {
      setError('Sign up failed. Username may already exist.')
    }
  }

  return (
    <div className="px-1 py-8 max-w-7xl mx-auto justify-center">
      <div className="text-center mb-8">
        <PageTitle>Sign Up</PageTitle>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-4">
        <p>
          Create an account to manage your rosters, track stats, and more. <br/>
          Please ensure your username is at least 4 characters long and your password is at least 6 characters long.<br/>
          Please do not use your email address as a username, as it will not be used for account recovery.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="User Name"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          <div className="flex justify-center">
            <Button type="submit">
              <h6>Sign Up</h6>
            </Button>
          </div>
        </form>

        <p className="text-sm text-center text-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-main underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
