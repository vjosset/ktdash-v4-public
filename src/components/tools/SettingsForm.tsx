'use client'

import { Button, SectionTitle } from '@/components/ui'
import { GAME } from '@/lib/config/game_config'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function SettingsForm() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt && 'prompt' in deferredPrompt) {
      const promptEvent = deferredPrompt as any
      promptEvent.prompt()
      await promptEvent.userChoice
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Display Settings */}
      {/*
      <div>
        <SectionTitle>Display</SectionTitle>
        <div>
          <Checkbox id="showPortraits"
            checked={settings.showPortraits}
            onChange={() => updateSettings({ showPortraits: !settings.showPortraits })} />
          <Label htmlFor="showPortraits">Show Portraits</Label>
        </div>
        <div>
          <Checkbox id="showNarrative"
            checked={settings.showNarrative}
            onChange={() => updateSettings({ showNarrative: !settings.showNarrative })} />
          <Label htmlFor="showNarrative">Show Narrative Gear</Label>
        </div>
      </div>
      */}

      {/* Install PWA */}
      {deferredPrompt && (
        <Button onClick={handleInstall}>
          <h6>Install {GAME.NAME} App</h6>
        </Button>
      )}

      {/* Old KTDash */}
      <div>
        <SectionTitle>Old KTDash</SectionTitle>
        <p>
          Looking for the old KTDash? It's now at <a href="https://old.ktdash.app" target="_blank" style={{textDecoration: 'underline'}}>https://old.ktdash.app</a>.
        </p>
      </div>

      {/* Clear Cache */}
      <div>
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
      </div>

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
