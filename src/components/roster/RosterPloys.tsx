'use client'

import Markdown from '@/components/ui/Markdown'
import { KillteamPlain, RosterPlain } from '@/types'
import { toast } from 'sonner'
import { Checkbox } from '../ui'

type RosterPloysProps = {
  killteam?: KillteamPlain | null
  roster?: RosterPlain | null
  isOwner: Boolean
  onRosterUpdate?: (updatedRoster: RosterPlain) => void
}

export default function RosterPloys({ killteam, roster, isOwner, onRosterUpdate }: RosterPloysProps) {
  const rosterPloyIds = roster?.ployIds?.split(',').filter(Boolean) ?? [];

  const sortedPloys = killteam?.ploys?.sort((a, b) => a.ployType.localeCompare(b.ployType))

  const togglePloy = async (ployId: string) => {
    if (!roster) return;

    const isSelected = rosterPloyIds.includes(ployId)
    const newPloyIds = isSelected
      ? rosterPloyIds.filter(id => id !== ployId)
      : [...rosterPloyIds, ployId]

    const res = await fetch(`/api/rosters/${roster.rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ployIds: newPloyIds.join(',') }),
    })

    if (res.ok) {
      const updated = await res.json()
      onRosterUpdate?.(updated)
    } else {
      toast.error('Failed to update ploy')
    }
  }

  return (
    <div className="max-w-3xl items-center mx-auto">
      {sortedPloys?.map((ploy, idx) => {

        const prevType = idx > 0 ? sortedPloys[idx - 1].ployType : null
        const showHeading = ploy.ployType !== prevType

        return (
          <div key={ploy.ployId}
            onClick={(e) => { if ((e.target as HTMLElement).tagName === 'INPUT') return; togglePloy(ploy.ployId) }}>
            {showHeading && (
              <h4 className="text-main text-center my-4">
                {ploy.ployType === 'S' ? 'Strategy Ploys' : 'Firefight Ploys'}
              </h4>
            )}

            <h6 className="text-main">
              {isOwner && (
                <Checkbox
                  className="mr-2"
                  checked={rosterPloyIds.includes(ploy.ployId)}
                  onChange={() => togglePloy(ploy.ployId)}
                  aria-label={ploy.ployName}
                />
              )}
              {ploy.ployType == 'S' ? 'Strategy' : 'Firefight'}: {ploy.ployName}
            </h6>
            <Markdown>{ploy.description}</Markdown>
            <hr className="mx-12 my-2" />
          </div>
        )
      })}
    </div>
  )
}
