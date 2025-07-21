'use client'

import { RosterPlain } from '@/types'
import clsx from 'clsx'
import { useState } from 'react'
import Markdown from 'react-markdown'

type RosterToolsProps = {
  roster: RosterPlain
}

export default function RosterTools({ roster }: RosterToolsProps) {
  const [tab, setTab] = useState<'composition' | 'equip' | 'ploys' | 'ops'>('composition')

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
      selected
        ? 'border-main text-main'
        : 'border-transparent text-muted hover:text-foreground'
    )

  return (
    <div className="w-full">
      <div className="flex justify-center space-x-4 border-b border-zinc-700 mb-4">
        <button className={tabClasses(tab === 'composition')} onClick={() => setTab('composition')}>
          Composition
        </button>
        {(roster.killteam?.equipments?.length ?? 0) > 0 && 
          <button className={tabClasses(tab === 'equip')} onClick={() => setTab('equip')}>
            Equipment
          </button>
        }
        {(roster.killteam?.ploys?.length ?? 0) > 0 &&
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

      <div className="text-sm leading-relaxed max-h-[60vh] overflow-y-auto px-2">
        <div className={tab === 'composition' ? 'block' : 'hidden'}>
          <em>Archetypes: {roster.killteam?.archetypes ?? 'None'}</em>
          <hr className="mx-12 my-2" />
          <Markdown>{roster.killteam?.composition}</Markdown>
        </div>
        <div className={tab === 'equip' ? 'block' : 'hidden'}>
          {roster.killteam?.equipments?.map((eq, idx) => {
            return (
              <div key={eq.eqId}>
                <h6>{eq.eqName}</h6>
                <Markdown>{eq.description}</Markdown>
                <hr className="mx-12 my-2" />
              </div>
            )
          })}
        </div>
        <div className={tab === 'ploys' ? 'block' : 'hidden'}>
          {roster.killteam?.ploys?.map((ploy, idx) => {
            return (
              <div key={ploy.ployId}>
                <h6>{ploy.ployType == 'S' ? 'Strategy' : 'Firefight'}: {ploy.ployName}</h6>
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
