'use client'

import { KillteamPlain } from '@/types'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, Input, Label, Modal } from '../ui'

export default function AddRosterForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [showAddRosterModal, setShowAddRosterModal] = useState(false)
  const [creatingRoster, setCreatingRoster] = useState(false)
  const [loading, setLoading] = useState(true)
  const [killteams, setKillteams] = useState<any[]>([])
  const [rosterName, setRosterName] = useState('')
  const [selectedKillteam, setSelectedKillteam] = useState<KillteamPlain | null>(null)
  const [useDefaultRoster, setUseDefaultRoster] = useState<boolean>(true)

  const userName = session?.user?.userName
  const userId = session?.user?.userId

  // Get the available killteams
  // Handle loading times
  useEffect(() => {
    if (!userId) return

    setLoading(true)
    fetch('/api/killteams')
      .then((res) => res.json())
      .then((data) => {
        setKillteams(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load killteams:', err)
        setLoading(false)
      })
  }, [userId])

  if (!userName) return null

  return (
    <div className="text-center my-auto">
      <Button
        onClick={() => setShowAddRosterModal(true)}
      >
        <h6>+ New Roster</h6>
      </Button>

      {showAddRosterModal && 
        <Modal
          title="Create New Roster"
          onClose={() => setShowAddRosterModal(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowAddRosterModal(false)}
                disabled={creatingRoster}
              >
                <h6>Cancel</h6>
              </Button>
              <Button
                className="px-3 py-1 rounded-md bg-primary text-white hover:bg-primary/80 disabled:opacity-50"
                disabled={!selectedKillteam || creatingRoster}
                onClick={async () => {
                  setCreatingRoster(true)

                  // Check if we should copy the default roster
                  if (useDefaultRoster && selectedKillteam?.defaultRoster) {
                    try {
                      const res = await fetch(`/api/rosters/${selectedKillteam.defaultRoster.rosterId}/clone`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          rosterName: rosterName == '' ? selectedKillteam?.killteamName : rosterName,
                          killteamId: selectedKillteam.killteamId,
                        }),
                      })
  
                      if (!res.ok) throw new Error('Failed to create roster')
                      toast.success('Roster created, redirecting...')
  
                      const { rosterId } = await res.json()
                      router.push(`/rosters/${rosterId}`)
                    } catch (err) {
                      console.error(err)
                      toast.error('Could not create roster')
                    } finally {
                      setCreatingRoster(false)
                    }
                  }
                  else {
                    try {
                      const res = await fetch('/api/rosters', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          rosterName: rosterName == '' ? selectedKillteam?.killteamName : rosterName,
                          killteamId: selectedKillteam?.killteamId,
                        }),
                      })
  
                      if (!res.ok) throw new Error('Failed to create roster')
                      toast.success('Roster created, redirecting...')
  
                      const { rosterId } = await res.json()
                      router.push(`/rosters/${rosterId}`)
                    } catch (err) {
                      console.error(err)
                      toast.error('Could not create roster')
                    } finally {
                      setCreatingRoster(false)
                    }
                  }
                }}
              >
                <h6>{creatingRoster ? 'Creating...' : 'Create'}</h6>
              </Button>
            </div>
          }
        >
          {loading ? (
            <div className="p-4 space-y-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid-cols-2 items-center gap-2">
                <Label>Killteam</Label>
                <select
                  className="w-full bg-card border border-border rounded p-2 text-sm"
                  value={selectedKillteam?.killteamId || ''}
                  onChange={(e) => {
                    const selected = killteams.find(kt => kt.killteamId === e.target.value);
                    setSelectedKillteam(selected || null);
                  }}
                >
                  <option value="">Select a killteam...</option>
                  {killteams.map((killteam) => (
                    <option key={killteam.killteamId} value={killteam.killteamId}>
                      {killteam.killteamName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid-cols-2 items-center gap-2">
                <Label>Roster Name</Label>
                <Input
                  type="text"
                  value={rosterName ?? ''}
                  placeholder={selectedKillteam?.killteamName || 'Select a Killteam'}
                  className="w-full"
                  onChange={(e) => setRosterName(e.target.value)}
                />
              </div>
              {selectedKillteam && selectedKillteam.defaultRoster && (
                <div className="grid-cols-2 items-center gap-2">
                  <Checkbox
                    type="checkbox"
                    checked={useDefaultRoster}
                    onChange={(e) => setUseDefaultRoster(e.target.checked)}
                  />
                  { ' Import Default Roster' }
                </div>
              )}
            </div>
          )}
        </Modal>
      }
    </div>
  )
}