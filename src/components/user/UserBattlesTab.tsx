'use client'

import BattleRecord from '@/components/shared/BattleRecord'
import { DeletedRosterBadge, RosterLink, UserLink } from '@/components/shared/Links'
import { SectionTitle } from '@/components/ui'
import { toLocalDateTime } from '@/lib/utils/utils'
import { BattlePlain, BattleRosterInfo } from '@/types'
import clsx from 'clsx'

type Outcome = 'W' | 'L' | 'D'

const outcomeClasses: Record<Outcome, string> = {
  W: 'text-green-500',
  L: 'text-red-500',
  D: 'text-muted',
}

/*
  Every row is read from the perspective of the profile's user. A battle always
  has exactly one of their rosters in it - both sides belonging to one player is
  rejected when the battle is created - so "mine" and "theirs" are always well
  defined.
*/
function perspectiveFor(battle: BattlePlain, userId: string) {
  const isSlotA = battle.rosterA.userId === userId
  const mine: BattleRosterInfo = isSlotA ? battle.rosterA : battle.rosterB
  const opponent: BattleRosterInfo = isSlotA ? battle.rosterB : battle.rosterA
  const outcome: Outcome = battle.result === 'D' ? 'D' : (battle.result === 'A') === isSlotA ? 'W' : 'L'

  // Slot A is always the reporter
  return { isReporter: isSlotA, mine, opponent, outcome }
}

function RosterSide({ side }: { side: BattleRosterInfo }) {
  return side.rosterId
    ? <RosterLink rosterId={side.rosterId} rosterName={side.rosterName} />
    : <DeletedRosterBadge rosterName={side.rosterName} />
}

/*
  Read-only. Confirming and disputing stay on each roster's own Battles tab,
  which the roster links lead to.

  The server only sends unconfirmed battles to the profile's own user, so any
  pending row here is being viewed by that user - which is what makes the
  "your" / "their" wording below safe.
*/
export default function UserBattlesTab({ battles, userId }: { battles: BattlePlain[]; userId: string }) {
  // Records count confirmed battles only, even on your own profile - the same
  // rule as the roster Battles tab, so the two always agree
  const record = battles.reduce(
    (acc, battle) => {
      if (!battle.isConfirmed) return acc
      const { outcome } = perspectiveFor(battle, userId)
      if (outcome === 'W') acc.wins += 1
      else if (outcome === 'L') acc.losses += 1
      else acc.draws += 1
      return acc
    },
    { wins: 0, losses: 0, draws: 0 },
  )

  // Draws are in the denominator, matching every other win rate in the app
  const recordedBattles = record.wins + record.losses + record.draws
  const winRate = recordedBattles > 0 ? `${Math.round((record.wins / recordedBattles) * 100)}%` : '—'

  return (
    <div className="max-w-2xl mx-auto px-2">
      <div className="flex mb-4">
        <div className="border border-border rounded px-4 py-2">
          <BattleRecord wins={record.wins} losses={record.losses} draws={record.draws} winRate={winRate} />
        </div>
      </div>

      <SectionTitle>Battle History</SectionTitle>

      <ul className="list-none pl-0 divide-y divide-border border-y border-border">
        {battles.map(battle => {
          const { isReporter, mine, opponent, outcome } = perspectiveFor(battle, userId)

          return (
            <li key={battle.battleId} className="py-2">
              <div className="text-xs text-muted">{toLocalDateTime(battle.battleDate)}</div>

              <div className="flex items-center gap-3 mt-0.5">
                <span
                  className={clsx(
                    'flex-shrink-0 w-4 text-center font-bold',
                    outcomeClasses[outcome],
                    !battle.isConfirmed && 'opacity-50',
                  )}
                  title={outcome === 'W' ? 'Win' : outcome === 'L' ? 'Loss' : 'Draw'}
                >
                  {outcome}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 text-sm">
                    <RosterSide side={mine} />
                    <span className="text-muted">vs</span>
                    <RosterSide side={opponent} />
                    <span className="text-muted">by</span>
                    <UserLink userName={opponent.userName} />
                  </div>

                  {!battle.isConfirmed && (
                    <div className="mt-0.5 text-xs text-muted italic">
                      {isReporter ? 'Awaiting their confirmation' : 'Awaiting your confirmation'}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
