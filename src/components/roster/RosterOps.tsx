'use client'

import Markdown from '@/components/ui/Markdown'
import { DEFAULT_SETTINGS, getSetting } from '@/lib/settings'
import { CritOps, CritOps2024, KillOpChart, TacOps, TacOps2024 } from '@/lib/utils/operations'
import { getRandom } from '@/lib/utils/utils'
import { RosterPlain } from '@/types'
import { useEffect, useState } from 'react'
import { GiRollingDices } from 'react-icons/gi'
import { FiStar } from 'react-icons/fi'

type RosterOpsProps = {
  roster?: RosterPlain | null
  onRosterUpdate?: (updatedRoster: RosterPlain) => void
}

export default function RosterOps({ roster, onRosterUpdate }: RosterOpsProps) {
  /*
    Everything below is persisted in localStorage, which the server cannot see.
    Reading it while rendering makes the client's first render disagree with the
    server's HTML, which is exactly what React reports as a hydration error. So
    the first render uses the same defaults the server used, and the stored
    values are loaded once, after mount.
  */
  const [hydrated, setHydrated] = useState(false)
  const [critOpsSetting, setCritOpsSetting] = useState<string>(DEFAULT_SETTINGS.critOps)
  const [tacOpsSetting, setTacOpsSetting] = useState<string>(DEFAULT_SETTINGS.tacOps)
  const [selectedCritOpTitle, setSelectedCritOpTitle] = useState('')
  const [selectedTacOpTitle, setSelectedTacOpTitle] = useState('')
  const [startingEnemyOps, setStartingEnemyOps] = useState('0')
  const [primaryOp, setPrimaryOp] = useState('')

  useEffect(() => {
    setCritOpsSetting(getSetting('critOps'))
    setTacOpsSetting(getSetting('tacOps'))
    setSelectedCritOpTitle(localStorage.getItem('selectedCritOpTitle') || '')
    setSelectedTacOpTitle(localStorage.getItem('selectedTacOpTitle') || '')
    setStartingEnemyOps(localStorage.getItem('startingEnemyOps') || '0')
    setPrimaryOp(localStorage.getItem('primaryOp') || '')
    setHydrated(true)
  }, [])

  const critOps = critOpsSetting == '2024' ? CritOps2024 : CritOps
  const tacOps = tacOpsSetting == '2024' ? TacOps2024 : TacOps

  const teamTacOps = tacOps.filter((op) => roster?.killteam?.archetypes?.includes(op.archetype))

  useEffect(() => {
    // Skip the mount pass: it would still hold the pre-load empty value and
    // would wipe the selection the effect above is restoring
    if (!hydrated) return
    if (selectedCritOpTitle) {
      localStorage.setItem('selectedCritOpTitle', selectedCritOpTitle)
    } else {
      localStorage.removeItem('selectedCritOpTitle')
    }
  }, [hydrated, selectedCritOpTitle])

  useEffect(() => {
    if (!hydrated) return
    if (selectedTacOpTitle) {
      localStorage.setItem('selectedTacOpTitle', selectedTacOpTitle)
    } else {
      localStorage.removeItem('selectedTacOpTitle')
    }
  }, [hydrated, selectedTacOpTitle])

  useEffect(() => {
    if (!hydrated) return
    if (startingEnemyOps) {
      localStorage.setItem('startingEnemyOps', startingEnemyOps)
    } else {
      localStorage.removeItem('startingEnemyOps')
    }
  }, [hydrated, startingEnemyOps])

  useEffect(() => {
    if (!hydrated) return
    if (primaryOp) {
      localStorage.setItem('primaryOp', primaryOp)
    } else {
      localStorage.removeItem('primaryOp')
    }
  }, [hydrated, primaryOp])

  const selectedCritOp = critOps.find(
    (m) => m.title === selectedCritOpTitle
  )

  const selectedTacOp = teamTacOps.find(
    (m) => m.title === selectedTacOpTitle
  )

  const selectedKillOp = KillOpChart[Number(startingEnemyOps) - 5]

  return (
    <div className="max-w-3xl items-center mx-auto">
      {/* Selectors for CritOp, TacOp, and KillOp (starting enemy operatives) */}
                    
      {/* CritOp Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm w-20">CritOp:</span>
          <div className="flex flex-1">
            <select
              className="flex-1 h-8 px-3 text-sm bg-card border border-border rounded-l-md appearance-none"
              value={selectedCritOpTitle}
              onChange={(e) => setSelectedCritOpTitle(e.target.value)}
            >
              <option value="">Select a Crit op...</option>
              {critOps.map((op) => (
                <option key={op.title} value={op.title}>
                  {op.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-lg border border-border border-l-0 rounded-r-md bg-zinc-900 hover:bg-zinc-800"
              onClick={() => {
                if (critOps.length === 0) return
                const currentCritOpTitle = selectedCritOpTitle
                let randomCritOp = getRandom(critOps)

                // Make sure we give them a different op
                while (randomCritOp.title === currentCritOpTitle && critOps.length > 1) {
                  randomCritOp = getRandom(critOps)
                }
                setSelectedCritOpTitle(randomCritOp.title)
              }}
            >
              <GiRollingDices />
            </button>
          </div>
        </div>
      </div>

      {/* TacOp Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm w-20">TacOp:</span>
          <div className="flex flex-1">
            <select
              className="flex-1 h-8 px-3 text-sm bg-card border border-border rounded-l-md appearance-none"
              value={selectedTacOpTitle}
              onChange={(e) => setSelectedTacOpTitle(e.target.value)}
            >
              <option value="">Select a Tac op...</option>
              {teamTacOps.map((op) => (
                <option key={op.title} value={op.title}>
                  {op.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-lg border border-border border-l-0 rounded-r-md bg-zinc-900 hover:bg-zinc-800"
              onClick={() => {
                if (teamTacOps.length === 0) return
                const currentTacOpTitle = selectedTacOpTitle
                let randomTacOp = getRandom(teamTacOps)

                // Make sure we give them a different op
                while (randomTacOp.title === currentTacOpTitle && teamTacOps.length > 1) {
                  randomTacOp = getRandom(teamTacOps)
                }
                setSelectedTacOpTitle(randomTacOp.title)
              }}
            >
              <GiRollingDices />
            </button>
          </div>
        </div>
      </div>
      
      {/* KillOp Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm w-20">KillOp:</span>
          <div className="flex flex-1">
            <select
              className="flex-1 h-8 px-3 text-sm bg-card border border-border rounded-md appearance-none"
              value={startingEnemyOps}
              onChange={(e) => setStartingEnemyOps(e.target.value)}
            >
              <option value="">Select opponent team size...</option>
              <option value="5">5 Enemy Operatives</option>
              <option value="6">6 Enemy Operatives</option>
              <option value="7">7 Enemy Operatives</option>
              <option value="8">8 Enemy Operatives</option>
              <option value="9">9 Enemy Operatives</option>
              <option value="10">10 Enemy Operatives</option>
              <option value="11">11 Enemy Operatives</option>
              <option value="12">12 Enemy Operatives</option>
              <option value="13">13 Enemy Operatives</option>
              <option value="14">14 Enemy Operatives</option>
            </select>
          </div>
        </div>
      </div>
      <hr/>

      {/* Show the actual selections */}
      {selectedCritOp &&
        <>
          <div className="flex items-center gap-2">
            <h5 className="text-main flex-1">CritOp: {selectedCritOp.title}</h5>
            <button
              type="button"
              title="Set as primary op"
              onClick={() => setPrimaryOp(primaryOp === 'crit' ? '' : 'crit')}
              className={`text-xl ${primaryOp === 'crit' ? 'text-main' : 'text-muted-foreground opacity-30 hover:opacity-70'}`}
            >
              <FiStar />
            </button>
          </div>
          <Markdown>{selectedCritOp.description}</Markdown>
          <hr/>
        </>
      }
      {selectedTacOp &&
        <>
          <div className="flex items-center gap-2">
            <h5 className="text-main flex-1">TacOp: {selectedTacOp.title}</h5>
            <button
              type="button"
              title="Set as primary op"
              onClick={() => setPrimaryOp(primaryOp === 'tac' ? '' : 'tac')}
              className={`text-xl ${primaryOp === 'tac' ? 'text-main' : 'text-muted-foreground opacity-30 hover:opacity-70'}`}
            >
              <FiStar />
            </button>
          </div>
          <Markdown>{selectedTacOp.description}</Markdown>
          <hr/>
        </>
      }
      {selectedKillOp &&
        <>
          <div className="flex items-center gap-2">
            <h5 className="text-main flex-1">KillOp:</h5>
            <button
              type="button"
              title="Set as primary op"
              onClick={() => setPrimaryOp(primaryOp === 'kill' ? '' : 'kill')}
              className={`text-xl ${primaryOp === 'kill' ? 'text-main' : 'text-muted-foreground opacity-30 hover:opacity-70'}`}
            >
              <FiStar />
            </button>
          </div>
          <table className="text-center">
            <thead>
              <tr className="text-center">
                <th>Kills</th>
                {selectedKillOp.map((obj, idx) => (
                  <th className="text-center" key={idx}>
                    {obj}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <th>VP</th>
                {selectedKillOp.map((obj, idx) => (
                  <td key={idx}>
                    {idx + 1} VP
                  </td>
                ))}
              </tr>
            </tbody>                    
          </table>
        </>
      }
    </div>
  )
}
