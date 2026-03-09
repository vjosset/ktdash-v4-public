import { MatchResultRepository } from '@/repositories/matchResult.repository'
import { prisma } from '@/lib/prisma'
import { MATCH_OUTCOME, MatchOutcome, MatchResultPlain } from '@/types'

function toRosterInfo(raw: {
  rosterId: string
  rosterName: string
  userId: string
  killteam: { killteamName: string } | null
  user: { userName: string } | null
}) {
  return {
    rosterId: raw.rosterId,
    rosterName: raw.rosterName,
    userId: raw.userId,
    userName: raw.user?.userName ?? '',
    killteamName: raw.killteam?.killteamName,
  }
}

function toPlain(raw: {
  matchResultId: number
  rosterAId: string
  rosterBId: string
  result: string
  rosterAConfirmed: boolean
  rosterBConfirmed: boolean
  matchDate: Date
  rosterA: { rosterId: string; rosterName: string; userId: string; killteam: { killteamName: string } | null; user: { userName: string } | null }
  rosterB: { rosterId: string; rosterName: string; userId: string; killteam: { killteamName: string } | null; user: { userName: string } | null }
}): MatchResultPlain {
  return {
    matchResultId: raw.matchResultId,
    rosterAId: raw.rosterAId,
    rosterBId: raw.rosterBId,
    result: raw.result as MatchOutcome,
    rosterAConfirmed: raw.rosterAConfirmed,
    rosterBConfirmed: raw.rosterBConfirmed,
    matchDate: raw.matchDate,
    rosterA: toRosterInfo(raw.rosterA),
    rosterB: toRosterInfo(raw.rosterB),
  }
}

export class MatchResultService {
  private static repository = new MatchResultRepository()

  static async createPendingMatch(
    rosterAId: string,
    rosterBId: string,
    result: string,
    userId: string
  ): Promise<MatchResultPlain> {
    if (!Object.values(MATCH_OUTCOME).includes(result as MatchOutcome)) {
      throw new Error('Invalid result: must be A, B, or D')
    }
    if (rosterAId === rosterBId) {
      throw new Error('Cannot record a match against yourself')
    }

    // Verify user owns rosterA before creating
    const rosterA = await prisma.roster.findUnique({ where: { rosterId: rosterAId }, select: { userId: true } })
    if (!rosterA) throw new Error('Roster not found')
    if (rosterA.userId !== userId) throw new Error('You do not own this roster')

    const matchResult = await this.repository.createMatchResult({ rosterAId, rosterBId, result })
    return toPlain(matchResult)
  }

  static async confirmMatch(matchResultId: number, userId: string): Promise<MatchResultPlain> {
    const existing = await this.repository.getMatchResult(matchResultId)
    if (!existing) throw new Error('Match not found')
    if (existing.rosterBConfirmed) throw new Error('Match already confirmed')
    if (existing.rosterB.userId !== userId) throw new Error('You do not own the opponent roster')

    const updated = await this.repository.confirmMatch(matchResultId)
    return toPlain(updated)
  }

  static async disputeMatch(matchResultId: number, userId: string): Promise<void> {
    const existing = await this.repository.getMatchResult(matchResultId)
    if (!existing) throw new Error('Match not found')
    if (existing.rosterBConfirmed) throw new Error('Match already confirmed')
    const isRosterA = existing.rosterA.userId === userId
    const isRosterB = existing.rosterB.userId === userId
    if (!isRosterA && !isRosterB) throw new Error('You do not have permission to remove this match')

    await this.repository.deleteMatchResult(matchResultId)
  }

  static async getPendingMatchesForUser(userId: string): Promise<MatchResultPlain[]> {
    const rows = await this.repository.getPendingMatchesForUser(userId)
    return rows.map(toPlain)
  }

  static async getMatchHistoryForRoster(rosterId: string): Promise<MatchResultPlain[]> {
    const rows = await this.repository.getMatchHistoryForRoster(rosterId)
    return rows.map(toPlain)
  }

  static async getMatchHistoryForUser(userId: string, confirmedOnly = true): Promise<MatchResultPlain[]> {
    const rows = await this.repository.getMatchHistoryForUser(userId, confirmedOnly)
    return rows.map(toPlain)
  }

  static async hasConfirmedMatchResults(rosterId: string): Promise<boolean> {
    return this.repository.hasConfirmedMatchResults(rosterId)
  }

  static async hasMatchResultsForUser(userId: string, confirmedOnly: boolean): Promise<boolean> {
    return this.repository.hasMatchResultsForUser(userId, confirmedOnly)
  }
}
