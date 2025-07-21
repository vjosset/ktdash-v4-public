'use client'

import Markdown from '@/components/ui/Markdown'
import { KillteamPlain, RosterPlain } from '@/types'
import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '../ui'

type KillteamInfoProps = {
  killteam?: KillteamPlain | null
  roster?: RosterPlain | null
  onRosterUpdate?: (updatedRoster: RosterPlain) => void
}

export default function KillteamInfo({ killteam, roster, onRosterUpdate }: KillteamInfoProps) {
  const [tab, setTab] = useState<'composition' | 'equip' | 'ploys' | 'ops'>('composition')
  const [rosterEqIds, setRosterEqIds] = useState<string[]>(roster?.eqIds?.split(',').filter(Boolean) ?? []);

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-4 py-2 border-b-2 transition-colors',
      selected
        ? 'border-main text-main'
        : 'border-transparent text-muted hover:text-foreground'
    )
  
  const toggleEquipment = async (eqId: string) => {
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
    <div className="w-full">
      <div className="flex justify-center space-x-4 border-b border-border mb-4">
        <button className={tabClasses(tab === 'composition')} onClick={() => setTab('composition')}>
          Composition
        </button>
        {(killteam?.equipments?.length ?? 0) > 0 && 
          <button className={tabClasses(tab === 'equip')} onClick={() => setTab('equip')}>
            Equipment
          </button>
        }
        {(killteam?.ploys?.length ?? 0) > 0 &&
          <button className={tabClasses(tab === 'ploys')} onClick={() => setTab('ploys')}>
            Ploys
          </button>
        }
        {false && 
        (<button className={tabClasses(tab === 'ops')} onClick={() => setTab('ops')}>
          Ops
        </button>)
        }
      </div>

      <div className="leading-relaxed max-h-[60vh] overflow-y-auto px-2">
        <div className={tab === 'composition' ? 'block' : 'hidden'}>
          <em className="text-main">Archetypes: {killteam?.archetypes ?? 'None'}</em>
          <hr className="mx-12 my-2" />
          <Markdown>{killteam?.composition || ''}</Markdown>
        </div>
        <div className={tab === 'equip' ? 'block' : 'hidden'}>
          {roster && rosterEqIds && rosterEqIds.length > 0 &&
            <h4 className="text-main text-center my-4">Selected Equipment</h4>
          }
          {roster && killteam?.equipments
            ?.filter(eq => rosterEqIds.includes(eq.eqId))
            .map(eq => (
              <div key={eq.eqId}>
                <div className="flex items-center gap-2">
                  <h6 className="text-main">
                    <Checkbox
                      className="mr-2"
                      checked={rosterEqIds.includes(eq.eqId)}
                      onChange={() => toggleEquipment(eq.eqId)}
                    />
                    {eq.eqName}
                  </h6>
                  {eq.killteamId == null && (<em className="text-muted">(Universal)</em>)}
                </div>
                <Markdown>{eq.description || ''}</Markdown>
                <hr className="mx-12 my-2" />
              </div>
          ))}
          {roster != null &&
            <h4 className="text-main text-center my-4">Inactive Equipment</h4>
          }
          {bespokeEq?.map((eq, idx) => {
            return (
              <div key={eq.eqId}>
                <div className="flex items-center gap-2">
                  <h6 className="text-main">
                    {roster && (
                      <Checkbox
                        className="mr-2"
                        checked={rosterEqIds.includes(eq.eqId)}
                        onChange={() => toggleEquipment(eq.eqId)}
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
          {universalEq && universalEq.map((eq, idx) => {
            return (
              <div key={eq.eqId}>
                <div className="flex items-center gap-2">
                  <h6 className="text-main">
                    {roster && (
                      <Checkbox
                        className="mr-2"
                        checked={rosterEqIds.includes(eq.eqId)}
                        onChange={() => toggleEquipment(eq.eqId)}
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
        <div className={tab === 'ploys' ? 'block' : 'hidden'}>
          {killteam?.ploys?.map((ploy, idx) => {
            return (
              <div key={ploy.ployId}>
                <h6 className="text-main">{ploy.ployType == 'S' ? 'Strategy' : 'Firefight'}: {ploy.ployName}</h6>
                <Markdown>{ploy.description}</Markdown>
                <hr className="mx-12 my-2" />
              </div>
            )
          })}
        </div>
        <div className={tab === 'ops' ? 'block' : 'hidden'}>
          <em>Coming soon!</em>
        </div>
      </div>
    </div>
  )
}
