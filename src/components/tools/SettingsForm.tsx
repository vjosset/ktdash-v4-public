'use client'

import { Button, Checkbox, Input, Modal, SectionTitle } from '@/components/ui'
import { useLocalSettings } from '@/hooks/useLocalSettings'
import { GAME } from '@/lib/config/game_config'
import type { FontFamilySetting } from '@/lib/settings'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AppVersion from './AppVersion'

export default function SettingsForm() {
  const { data: session } = useSession()
  const {
    settings,
    updateSetting,
  } = useLocalSettings()
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [showConfirmLogOut, setShowConfirmLogOut] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [isPrivateLoaded, setIsPrivateLoaded] = useState(false)
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })
  }, [])

  // Load server-side isPrivate value for the logged-in user
  useEffect(() => {
    if (!session?.user?.userName) return
    fetch(`/api/users/${session.user.userName}`)
      .then(r => r.json())
      .then(data => {
        setIsPrivate(data.isPrivate ?? false)
        setIsPrivateLoaded(true)
      })
      .catch(() => setIsPrivateLoaded(true))
  }, [session?.user?.userName])

  const toggleIsPrivate = async () => {
    if (!session?.user?.userName) return
    const newValue = !isPrivate
    setIsPrivate(newValue)
    const res = await fetch(`/api/users/${session.user.userName}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrivate: newValue }),
    })
    if (!res.ok) {
      // Revert on failure
      setIsPrivate(!newValue)
      toast.error('Could not update privacy setting')
    }
  }

  const handleInstall = async () => {
    if (deferredPrompt && 'prompt' in deferredPrompt) {
      const promptEvent = deferredPrompt as any
      promptEvent.prompt()
      await promptEvent.userChoice
      setDeferredPrompt(null)
    }
  }

  const updatePassword = async () => {
    if (!session?.user) {
      toast.error('Please log in before updating your password.')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const res = await fetch(`/api/users/${session?.user?.userName}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      toast.success('Password updated')
      // Optionally reset password fields
      setPassword('')
      setConfirmPassword('')
    } else if (res.status === 401) {
      toast.error('Unauthorized. Please log in again.')
    } else {
      const errorText = await res.text()
      toast.error(`Error: ${errorText || 'Could not update password'}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Display Settings */}
      <div className="space-y-4">
        <div>
          <SectionTitle>Display</SectionTitle>
          <div className="space-y-2">
            <label htmlFor="showPortraits" className="flex items-center gap-3">
              <Checkbox
                id="showPortraits"
                checked={settings.showPortraits}
                onChange={() => updateSetting('showPortraits', !settings.showPortraits)}
              />
              Show Portraits
            </label>
            <label htmlFor="showOpTypeFirst" className="flex items-center gap-3">
              <Checkbox
                id="showOpTypeFirst"
                checked={settings.showOpTypeFirst}
                onChange={() => updateSetting('showOpTypeFirst', !settings.showOpTypeFirst)}
              />
              Show Operative Type First
            </label>
            <label htmlFor="fontFamily" className="flex items-center gap-3">
              Font:
              <select
                id="fontFamily"
                className="flex-1 min-w-0 bg-card border border-border rounded p-2 text-sm"
                value={settings.fontFamily}
                onChange={(event) => updateSetting('fontFamily', event.target.value as FontFamilySetting)}
              >
                <option value="oswald">Oswald (Default)</option>
                <option value="rajdhani">Rajdhani</option>
                <option value="arial narrow">Arial Narrow</option>
              </select>
            </label>

            <SectionTitle>Game</SectionTitle>
            <label htmlFor="critOps" className="flex items-center gap-3">
              Crit Ops Version: 
              <select
                id="critOps"
                className="flex-1 min-w-0 bg-card border border-border rounded p-2 text-sm"
                value={settings.critOps}
                onChange={(event) => updateSetting('critOps', event.target.value)}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </label>
            <label htmlFor="tacOps" className="flex items-center gap-3">
              Tac Ops Version: 
              <select
                id="tacOps"
                className="flex-1 min-w-0 bg-card border border-border rounded p-2 text-sm"
                value={settings.tacOps}
                onChange={(event) => updateSetting('tacOps', event.target.value)}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Install PWA */}
      {deferredPrompt && (
        <Button onClick={handleInstall}>
          <h6>Install {GAME.NAME} App</h6>
        </Button>
      )}

      {/* Clear Cache */}
      <>
        <SectionTitle>Cache</SectionTitle>
        <p>If something looks outdated, try clearing the cache.</p>
        <Button onClick={async () => {
          const success = await clearServiceWorkerCache()
          if (success) {
            toast.success('Cache cleared, reloading...')
            window.location.reload()
          } else {
            toast.error('Failed to clear cache')
          }
        }}>
          <h6>Clear Cache</h6>
        </Button>
        
        <hr />
      </>

      {/* Privacy Settings */}
      {session?.user?.userId && isPrivateLoaded && (
        <div>
          <SectionTitle>Privacy</SectionTitle>
          <label htmlFor="isPrivate" className="flex items-center gap-3">
            <Checkbox
              id="isPrivate"
              checked={isPrivate}
              onChange={toggleIsPrivate}
            />
            Keep my rosters private
          </label>
          <p className="text-muted mt-1">
            When enabled, your rosters will not appear in the homepage spotlight, on kill team roster lists, or in the site index.
            You can still share your roster links; anyone with the link can view your roster.
          </p>
        </div>
      )}

      {/* Account Tools */}
      {session?.user?.userId && (
        <>
          {/* Log Out */}
          <div className="flex items-center justify-between mb-2">
            {/* Log Out */}
            <SectionTitle>Log Out</SectionTitle>
            <Button onClick={() => setShowConfirmLogOut(true)}>
              <h6>Log Out</h6>
            </Button>
          </div>

          {/* Change Password */}
          <div>
            <SectionTitle>Change Password</SectionTitle>
            <Input
              type="password"
              placeholder="New password"
              value={password}
              autoComplete="new-password"
              onChange={e => setPassword(e.target.value)} />
            <Input
              type="password"
              placeholder="Confirm New password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={e => setConfirmPassword(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={updatePassword}>
                <h6>Update Password</h6>
              </Button>
            </div>
          </div>
    
          {showConfirmLogOut &&
            <Modal
              title={'Log Out'}
              onClose={() => setShowConfirmLogOut(false)}
              footer={
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowConfirmLogOut(false)}>
                    <h6>Cancel</h6>
                  </Button>
                  <Button onClick={() => signOut({ callbackUrl: '/' })}>
                    <h6>Log Out</h6>
                  </Button>
                </div>
              }
            >
              <p className="text-sm text-foreground">
                Are you sure you want to log out?
              </p>
            </Modal>
          }
        </>
      )}

      {/* Version information */}
      <AppVersion />
    </div>
  )
}

export function clearServiceWorkerCache(): Promise<boolean> {
  console.log('Clearing SW cache...')
  console.log('SW Controller:', navigator.serviceWorker.controller)
  if (!navigator.serviceWorker?.controller) return Promise.resolve(false)

  return new Promise((resolve) => {
    const channel = new MessageChannel()

    /*
    Channel ports:
      port1	- Client (the page) - To listen for replies from the service worker
      port2	- Service Worker    - Used by the SW to send back a message
    */

    channel.port1.onmessage = (event) => {
      console.log('Reply from service worker:', event.data)
      resolve(event.data?.success ?? false)
    }

    navigator.serviceWorker.controller?.postMessage('CLEAR_CACHE', [channel.port2])
  })
}
