'use client'

import { useState } from 'react'
import { FiCopy } from 'react-icons/fi'
import { UserLink } from '../shared/Links'
import { Button, Input } from '../ui'

type Props = {
  initialUsername?: string
}

export default function ResetUserPasswordForm({ initialUsername = '' }: Props) {
  const [userNameInput, setUserNameInput] = useState(initialUsername)
  const [userCheckLoading, setUserCheckLoading] = useState(false)
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const checkUser = async () => {
    setUserCheckLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userNameInput)}`)
      if (!res.ok) throw new Error('Lookup failed')
      const user = await res.json()
      setUserExists(!!user)
    } catch (e) {
      console.error(e)
      setUserExists(null)
      setMessage('Lookup failed')
    } finally {
      setUserCheckLoading(false)
    }
  }

  const doReset = async () => {
    if (tempPassword.length < 8) {
      setMessage('Password too short')
      return
    }
    setResetLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userNameInput)}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: tempPassword })
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) setMessage('Not authorized to reset this password')
        else if (res.status === 404) setMessage('User not found')
        else setMessage((await res.text()) || 'Failed to reset password')
      } else {
        setMessage('Password reset. Share the temporary password with the user.')
      }
    } catch (e) {
      console.error(e)
      setMessage('Request failed')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="space-y-3 max-w-md">
      <div className="flex flex-col gap-2">
        <label className="text-sm">Username</label>
        <div className="flex items-center gap-2">
          <Input
            value={userNameInput}
            onChange={(e) => {
              setUserNameInput(e.target.value.trim())
              setUserExists(null)
              setMessage(null)
            }}
            placeholder="Enter username"
            className="rounded border px-2 py-1"
          />
          <Button onClick={checkUser} disabled={!userNameInput || userCheckLoading}>
            {userCheckLoading ? 'Checking…' : 'Check'}
          </Button>
        </div>
        {userExists === true && (
          <p className="text-sm text-green-700 gap-2 flex items-center">
            User exists:
            <UserLink userName={userNameInput} newTab={true} />
          </p>
        )}
        {userExists === false && <p className="text-sm text-red-500">User not found</p>}
      </div>

      {userExists === true && (
        <div className="flex flex-col gap-2">
          <label className="text-sm">Temporary Password</label>
          <div className="flex gap-2 items-center">
            <Input
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Temp Password"
              className="flex-1 rounded border px-2 py-1"
            />
            <Button
              variant="ghost"
              className="h-8"
              onClick={() => setTempPassword(genTempPassword())}
            >
              Generate
            </Button>
            <Button
              variant="ghost"
              className="h-8"
              onClick={async () => {
                if (!tempPassword) return
                try {
                  await navigator.clipboard.writeText(tempPassword)
                  setMessage('Copied to clipboard')
                } catch {
                  setMessage('Copy failed')
                }
              }}
              aria-label="Copy password"
            >
              <FiCopy />
            </Button>
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={doReset} disabled={!tempPassword || resetLoading}>
              {resetLoading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  )
}

function genTempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const pick = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `${pick(4)}${pick(4)}`
}
