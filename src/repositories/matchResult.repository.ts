import { BaseRepository } from './base.repository'

const rosterWithUser = {
  select: {
    rosterId: true,
    rosterName: true,
    userId: true,
    killteam: { select: { killteamName: true } },
    user: { select: { userName: true } },
  },
}

export class MatchResultRepository extends BaseRepository {
  async createMatchResult(data: { rosterAId: string; rosterBId: string; result: string }) {
    return this.prisma.matchResult.create({
      data: {
        rosterAId: data.rosterAId,
        rosterBId: data.rosterBId,
        result: data.result,
      },
      include: {
        rosterA: rosterWithUser,
        rosterB: rosterWithUser,
      },
    })
  }

  async getMatchResult(matchResultId: number) {
    return this.prisma.matchResult.findUnique({
      where: { matchResultId },
      include: {
        rosterA: rosterWithUser,
        rosterB: rosterWithUser,
      },
    })
  }

  async getPendingMatchesForUser(userId: string) {
    return this.prisma.matchResult.findMany({
      where: {
        rosterBConfirmed: false,
        rosterB: { userId },
      },
      include: {
        rosterA: rosterWithUser,
        rosterB: rosterWithUser,
      },
      orderBy: { matchDate: 'desc' },
    })
  }

  async getMatchHistoryForRoster(rosterId: string) {
    return this.prisma.matchResult.findMany({
      where: {
        OR: [{ rosterAId: rosterId }, { rosterBId: rosterId }],
      },
      include: {
        rosterA: rosterWithUser,
        rosterB: rosterWithUser,
      },
      orderBy: { matchDate: 'desc' },
    })
  }

  async confirmMatch(matchResultId: number) {
    return this.prisma.matchResult.update({
      where: { matchResultId },
      data: { rosterBConfirmed: true },
      include: {
        rosterA: rosterWithUser,
        rosterB: rosterWithUser,
      },
    })
  }

  async deleteMatchResult(matchResultId: number) {
    await this.prisma.matchResult.delete({
      where: { matchResultId },
    })
  }

  async getMatchHistoryForUser(userId: string, confirmedOnly = true) {
    return this.prisma.matchResult.findMany({
      where: {
        ...(confirmedOnly ? { rosterBConfirmed: true } : {}),
        OR: [
          { rosterA: { userId } },
          { rosterB: { userId } },
        ],
      },
      include: {
        rosterA: rosterWithUser,
        rosterB: rosterWithUser,
      },
      orderBy: { matchDate: 'desc' },
    })
  }

  async hasConfirmedMatchResults(rosterId: string): Promise<boolean> {
    const count = await this.prisma.matchResult.count({
      where: {
        rosterBConfirmed: true,
        OR: [{ rosterAId: rosterId }, { rosterBId: rosterId }],
      },
    })
    return count > 0
  }

  async hasMatchResultsForUser(userId: string, confirmedOnly: boolean): Promise<boolean> {
    const count = await this.prisma.matchResult.count({
      where: {
        ...(confirmedOnly ? { rosterBConfirmed: true } : {}),
        OR: [
          { rosterA: { userId } },
          { rosterB: { userId } },
        ],
      },
    })
    return count > 0
  }
}
