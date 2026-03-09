export const MATCH_OUTCOME = { A: 'A', B: 'B', D: 'D' } as const
export type MatchOutcome = typeof MATCH_OUTCOME[keyof typeof MATCH_OUTCOME]

export type MatchResultRosterInfo = {
  rosterId: string
  rosterName: string
  userId: string
  userName: string
  killteamName?: string
}

export type MatchResultPlain = {
  matchResultId: number
  rosterAId: string
  rosterBId: string
  result: MatchOutcome
  rosterAConfirmed: boolean
  rosterBConfirmed: boolean
  matchDate: Date
  rosterA?: MatchResultRosterInfo
  rosterB?: MatchResultRosterInfo
}

export class MatchResult {
  matchResultId: number
  rosterAId: string
  rosterBId: string
  result: MatchOutcome
  rosterAConfirmed: boolean
  rosterBConfirmed: boolean
  matchDate: Date
  rosterA?: MatchResultRosterInfo
  rosterB?: MatchResultRosterInfo

  constructor(data: MatchResultPlain) {
    this.matchResultId = data.matchResultId
    this.rosterAId = data.rosterAId
    this.rosterBId = data.rosterBId
    this.result = data.result
    this.rosterAConfirmed = data.rosterAConfirmed
    this.rosterBConfirmed = data.rosterBConfirmed
    this.matchDate = data.matchDate
    this.rosterA = data.rosterA
    this.rosterB = data.rosterB
  }

  get isPending(): boolean {
    return !this.rosterBConfirmed
  }

  get isConfirmed(): boolean {
    return this.rosterBConfirmed
  }

  toPlain(): MatchResultPlain {
    return {
      matchResultId: this.matchResultId,
      rosterAId: this.rosterAId,
      rosterBId: this.rosterBId,
      result: this.result,
      rosterAConfirmed: this.rosterAConfirmed,
      rosterBConfirmed: this.rosterBConfirmed,
      matchDate: this.matchDate,
      rosterA: this.rosterA,
      rosterB: this.rosterB,
    }
  }
}
