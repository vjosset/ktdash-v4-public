/*
  A Battle is a two-party attestation about a game played on a physical
  tabletop. The server cannot verify it, so one player reports and the other
  confirms. "A" and "B" are slots, not roles - `result` names the slot that won,
  never "the reporter" - so allowing either side to initiate needs no migration.
  Today the reporter is always slot A.
*/

export const BATTLE_OUTCOME = {
  ROSTER_A: 'A',
  ROSTER_B: 'B',
  DRAW: 'D',
} as const

export type BattleOutcome = typeof BATTLE_OUTCOME[keyof typeof BATTLE_OUTCOME]

export function isBattleOutcome(value: unknown): value is BattleOutcome {
  return value === BATTLE_OUTCOME.ROSTER_A || value === BATTLE_OUTCOME.ROSTER_B || value === BATTLE_OUTCOME.DRAW
}

/*
  One side of a battle, resolved live-or-snapshot: the live relation is preferred
  so renames show through, and the snapshot takes over once the roster is gone.
  A null rosterId is the signal that this side was deleted - it renders struck
  through, with nothing to link to.
*/
export type BattleRosterInfo = {
  rosterId: string | null
  userId: string | null
  rosterName: string
  userName: string
  killteamId: string
  killteamName: string
}

export type BattlePlain = {
  battleId: number
  result: BattleOutcome
  isConfirmed: boolean
  battleDate: Date
  rosterA: BattleRosterInfo
  rosterB: BattleRosterInfo
  eloBeforeA: number | null
  eloBeforeB: number | null
  eloAfterA: number | null
  eloAfterB: number | null
}

export class Battle {
  battleId: number
  result: BattleOutcome
  battleDate: Date
  rosterA: BattleRosterInfo
  rosterB: BattleRosterInfo
  eloBeforeA: number | null
  eloBeforeB: number | null
  eloAfterA: number | null
  eloAfterB: number | null

  // rosterBConfirmed is the entire state machine: false = pending, true = confirmed.
  // Disputed and withdrawn are both expressed by the row not existing.
  private rosterBConfirmed: boolean

  constructor(data: {
    battleId: number
    result: BattleOutcome
    rosterBConfirmed: boolean
    battleDate: Date
    rosterA: BattleRosterInfo
    rosterB: BattleRosterInfo
    eloBeforeA?: number | null
    eloBeforeB?: number | null
    eloAfterA?: number | null
    eloAfterB?: number | null
  }) {
    this.battleId = data.battleId
    this.result = data.result
    this.rosterBConfirmed = data.rosterBConfirmed
    this.battleDate = data.battleDate
    this.rosterA = data.rosterA
    this.rosterB = data.rosterB
    this.eloBeforeA = data.eloBeforeA ?? null
    this.eloBeforeB = data.eloBeforeB ?? null
    this.eloAfterA = data.eloAfterA ?? null
    this.eloAfterB = data.eloAfterB ?? null
  }

  get isConfirmed(): boolean {
    return this.rosterBConfirmed
  }

  get isPending(): boolean {
    return !this.rosterBConfirmed
  }

  toPlain(): BattlePlain {
    return {
      battleId: this.battleId,
      result: this.result,
      isConfirmed: this.rosterBConfirmed,
      battleDate: this.battleDate,
      rosterA: this.rosterA,
      rosterB: this.rosterB,
      eloBeforeA: this.eloBeforeA,
      eloBeforeB: this.eloBeforeB,
      eloAfterA: this.eloAfterA,
      eloAfterB: this.eloAfterB,
    }
  }
}

/*
  Aggregate record for one killteam, built from the snapshot columns so battles
  survive the deletion of the rosters that fought them.
*/
export type KillteamMatchup = {
  killteamId: string
  killteamName: string
  wins: number
  losses: number
  draws: number
  battles: number
}

export type KillteamBattleStats = {
  wins: number
  losses: number
  draws: number
  battles: number
  // Same killteam on both sides: one row would be a win and a loss at once, so
  // these are counted but excluded from the record and the matchup rows.
  mirrorBattles: number
  matchups: KillteamMatchup[]
}

/*
  One killteam's headline record, for the killteams index. Same shape as
  KillteamMatchup without the name, which that page already has.
*/
export type KillteamBattleRecord = {
  killteamId: string
  wins: number
  losses: number
  draws: number
  battles: number
}

export const BATTLE_STATS_PERIOD = {
  ALL: 'all',
  SIX_MONTHS: '6m',
  THREE_MONTHS: '3m',
  ONE_MONTH: '1m',
} as const

export type BattleStatsPeriod = typeof BATTLE_STATS_PERIOD[keyof typeof BATTLE_STATS_PERIOD]

export function isBattleStatsPeriod(value: unknown): value is BattleStatsPeriod {
  return Object.values(BATTLE_STATS_PERIOD).includes(value as BattleStatsPeriod)
}
