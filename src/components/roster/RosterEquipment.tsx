'use client'

import Markdown from '@/components/ui/Markdown'
import { KillteamPlain, RosterPlain } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '../ui'

type RosterEquipmentProps = {
  killteam?: KillteamPlain | null
  roster?: RosterPlain | null
  onRosterUpdate?: (updatedRoster: RosterPlain) => void
}

export default function RosterEquipment({ killteam, roster, onRosterUpdate }: RosterEquipmentProps) {
  const [rosterEqIds, setRosterEqIds] = useState<string[]>(roster?.eqIds?.split(',').filter(Boolean) ?? []);
  
  const toggleEquipment = async (eqId: string) => {
    if (!roster) return;
    const isSelected = rosterEqIds.includes(eqId)
    const newEqIds = isSelected
      ? rosterEqIds.filter(id => id !== eqId)
      : [...rosterEqIds, eqId]

    setRosterEqIds(newEqIds) // 💡 optimistic UI update

    const res = await fetch(`/api/rosters/${roster?.rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eqIds: newEqIds.join(',') }),
    })

    if (res.ok) {
      const updated = await res.json()
      onRosterUpdate?.(updated)
    } else {
      toast.error('Failed to update equipment')
      setRosterEqIds(rosterEqIds) // Roll back if error
    }
  }
  
  // Map the custom and universal equipments (excluding selected ones if we have a roster object)
  const bespokeEq = killteam?.equipments.filter((eq) => eq.killteamId != null && !rosterEqIds.includes(eq.eqId));
  const universalEq = killteam?.equipments.filter((eq) => eq.killteamId == null && !rosterEqIds.includes(eq.eqId));

  return (
    <div className="max-w-3xl items-center mx-auto">
      {roster && rosterEqIds && rosterEqIds.length > 0 &&
        <h4 className="text-main text-center my-4">Selected Equipment</h4>
      }
      {roster && roster.killteam?.equipments
        ?.filter(eq => rosterEqIds.includes(eq.eqId))
        .map(eq => (
          <div key={eq.eqId}
            onClick={(e) => { if ((e.target as HTMLElement).tagName === 'INPUT') return; toggleEquipment(eq.eqId) }}>
            <div className="flex items-center gap-2">
              <h6 className="text-main">
                <Checkbox
                  className="mr-2"
                  checked={rosterEqIds.includes(eq.eqId)}
                  onChange={() => toggleEquipment(eq.eqId)}
                  aria-label={eq.eqName}
                />
                {eq.eqName}
              </h6>
              {eq.killteamId == null && (<em className="text-muted">(Universal)</em>)}
            </div>
            <Markdown>{eq.description || ''}</Markdown>
            <hr className="mx-12 my-2" />
          </div>
      ))}
      {roster &&
        <h4 className="text-main text-center my-4">Inactive Equipment</h4>
      }
      {bespokeEq?.map((eq) => {
        return (
          <div key={eq.eqId}
            onClick={(e) => { if ((e.target as HTMLElement).tagName === 'INPUT') return; if (roster) toggleEquipment(eq.eqId) }}>
            <div className="flex items-center gap-2">
              <h6 className="text-main">
                {roster && (
                  <Checkbox
                    className="mr-2"
                    checked={rosterEqIds.includes(eq.eqId)}
                    onChange={() => toggleEquipment(eq.eqId)}
                    aria-label={eq.eqName}
                  />
                )}
                {eq.eqName}
              </h6>
              {eq.killteamId == null && (<em className="text-muted">(Universal)</em>)}
            </div>
            <Markdown>{eq.description || ''}</Markdown>
            <hr className="mx-12 my-2" />
          </div>
        )
      })}
      {universalEq && universalEq.length > 0 &&
        <h4 className="text-main text-center my-4">Universal Equipment</h4>
      }
      {universalEq && universalEq.map((eq) => {
        return (
          <div key={eq.eqId}
            onClick={(e) => { if ((e.target as HTMLElement).tagName === 'INPUT') return; if (roster) toggleEquipment(eq.eqId) }}>
            <div className="flex items-center gap-2">
              <h6 className="text-main">
                {roster && (
                  <Checkbox
                    className="mr-2"
                    checked={rosterEqIds.includes(eq.eqId)}
                    onChange={() => toggleEquipment(eq.eqId)}
                    aria-label={eq.eqName}
                  />
                )}
                {eq.eqName}
              </h6>
              {eq.killteamId == null && (<em className="text-muted">(Universal)</em>)}
            </div>
            <Markdown>{eq.description || ''}</Markdown>
            <hr className="mx-12 my-2" />
          </div>
        )
      })}
    </div>
  )
}
