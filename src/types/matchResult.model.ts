/*
  A MatchResult is a two-party attestation about a game played on a physical
  tabletop. The server cannot verify it, so one player reports and the other
  confirms. "A" and "B" are slots, not roles - `result` names the slot that won,
  never "the reporter" - so allowing either side to initiate needs no migration.
  Today the reporter is always slot A.
*/

export const MATCH_OUTCOME = {
  ROSTER_A: 'A',
  ROSTER_B: 'B',
  DRAW: 'D',
} as const

export type MatchOutcome = typeof MATCH_OUTCOME[keyof typeof MATCH_OUTCOME]

export function isMatchOutcome(value: unknown): value is MatchOutcome {
  return value === MATCH_OUTCOME.ROSTER_A || value === MATCH_OUTCOME.ROSTER_B || value === MATCH_OUTCOME.DRAW
}

/*
  One side of a match, resolved live-or-snapshot: the live relation is preferred
  so renames show through, and the snapshot takes over once the roster is gone.
  A null rosterId is the signal that this side was deleted - it renders struck
  through, with nothing to link to.
*/
export type MatchResultRosterInfo = {
  rosterId: string | null
  userId: string | null
  rosterName: string
  userName: string
  killteamId: string
  killteamName: string
}

export type MatchResultPlain = {
  matchResultId: number
  result: MatchOutcome
  isConfirmed: boolean
  matchDate: Date
  rosterA: MatchResultRosterInfo
  rosterB: MatchResultRosterInfo
  eloBeforeA: number | null
  eloBeforeB: number | null
  eloAfterA: number | null
  eloAfterB: number | null
}

export class MatchResult {
  matchResultId: number
  result: MatchOutcome
  matchDate: Date
  rosterA: MatchResultRosterInfo
  rosterB: MatchResultRosterInfo
  eloBeforeA: number | null
  eloBeforeB: number | null
  eloAfterA: number | null
  eloAfterB: number | null

  // rosterBConfirmed is the entire state machine: false = pending, true = confirmed.
  // Disputed and withdrawn are both expressed by the row not existing.
  private rosterBConfirmed: boolean

  constructor(data: {
    matchResultId: number
    result: MatchOutcome
    rosterBConfirmed: boolean
    matchDate: Date
    rosterA: MatchResultRosterInfo
    rosterB: MatchResultRosterInfo
    eloBeforeA?: number | null
    eloBeforeB?: number | null
    eloAfterA?: number | null
    eloAfterB?: number | null
  }) {
    this.matchResultId = data.matchResultId
    this.result = data.result
    this.rosterBConfirmed = data.rosterBConfirmed
    this.matchDate = data.matchDate
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

  toPlain(): MatchResultPlain {
    return {
      matchResultId: this.matchResultId,
      result: this.result,
      isConfirmed: this.rosterBConfirmed,
      matchDate: this.matchDate,
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
  Aggregate record for one killteam, built from the snapshot columns so matches
  survive the deletion of the rosters that played them.
*/
export type KillteamMatchup = {
  killteamId: string
  killteamName: string
  wins: number
  losses: number
  draws: number
  games: number
}

export type KillteamMatchStats = {
  wins: number
  losses: number
  draws: number
  games: number
  // Same killteam on both sides: one row would be a win and a loss at once, so
  // these are counted but excluded from the record and the matchup rows.
  mirrorGames: number
  matchups: KillteamMatchup[]
}

export const MATCH_STATS_PERIOD = {
  ALL: 'all',
  SIX_MONTHS: '6m',
  THREE_MONTHS: '3m',
  ONE_MONTH: '1m',
} as const

export type MatchStatsPeriod = typeof MATCH_STATS_PERIOD[keyof typeof MATCH_STATS_PERIOD]

export function isMatchStatsPeriod(value: unknown): value is MatchStatsPeriod {
  return Object.values(MATCH_STATS_PERIOD).includes(value as MatchStatsPeriod)
}
