'use client'

import { DeletedRosterBadge, RosterLink, UserLink } from '@/components/shared/Links'
import { toLocalDateTime } from '@/lib/utils/utils'
import { BattlePlain, BattleRosterInfo } from '@/types'
import clsx from 'clsx'

/*
  The admin view of recorded battles. There is no "my roster" here, so sides are
  ordered by outcome rather than by slot: winner first, loser second, each marked
  with a letter. A draw keeps slot order and marks both sides D.

  Slot A is always the reporter, but that is not surfaced - an admin scanning the
  list wants to know who won, and "reported by" only ever restated the first
  user's name.
*/

type Mark = 'W' | 'L' | 'D'

// Same colours the roster Battles tab uses for W/L/D
const markClasses: Record<Mark, string> = {
  W: 'text-green-500',
  L: 'text-red-500',
  D: 'text-muted',
}

type Side = { info: BattleRosterInfo; mark: Mark }

function sidesFor(battle: BattlePlain): Side[] {
  if (battle.result === 'D') {
    return [{ info: battle.rosterA, mark: 'D' }, { info: battle.rosterB, mark: 'D' }]
  }

  const [winner, loser] = battle.result === 'A'
    ? [battle.rosterA, battle.rosterB]
    : [battle.rosterB, battle.rosterA]

  return [{ info: winner, mark: 'W' }, { info: loser, mark: 'L' }]
}

/*
  One side of a battle. A deleted roster keeps the name snapshotted at report
  time, rendered as a dead badge rather than a link.
*/
function BattleSide({ info, mark }: Side) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={clsx('font-bold flex-shrink-0 w-4 text-center', markClasses[mark])}>{mark}</span>
      {info.rosterId
        ? <RosterLink rosterId={info.rosterId} rosterName={info.rosterName} newTab={true} />
        : <DeletedRosterBadge rosterName={info.rosterName} />
      }
      <span className="text-muted">by</span>
      <UserLink userName={info.userName} newTab={true} />
      <span className="text-muted">({info.killteamName})</span>
    </span>
  )
}

export default function AdminRecentBattles({ battles }: { battles: BattlePlain[] }) {
  if (battles.length === 0) {
    return <p className="text-muted">No battles recorded yet.</p>
  }

  return (
    <ul className="list-none pl-0 divide-y divide-border border-y border-border">
      {battles.map(battle => (
        <li key={battle.battleId} className={clsx('py-2', !battle.isConfirmed && 'opacity-60')}>
          {/* Stacked on narrow screens so the two sides never wrap into each
              other; side by side once there is room */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-sm">
            {sidesFor(battle).map(side => (
              <BattleSide key={side.mark + side.info.rosterName} info={side.info} mark={side.mark} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted">
            <span>{toLocalDateTime(battle.battleDate)}</span>
            {!battle.isConfirmed && <span className="italic">· Awaiting confirmation</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}
