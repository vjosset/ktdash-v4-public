import { MatchResult, MatchResultRosterInfo, isMatchOutcome } from '@/types'
import type { Prisma } from '@prisma/client'
import { BaseRepository } from './base.repository'

/*
  Both sides are pulled with their user and killteam so display can prefer the
  live relation over the snapshot. Nothing here needs the roster's ops.
*/
const matchResultInclude = {
  rosterA: {
    select: {
      rosterId: true,
      rosterName: true,
      eloRating: true,
      user: { select: { userId: true, userName: true } },
      killteam: { select: { killteamId: true, killteamName: true } },
    },
  },
  rosterB: {
    select: {
      rosterId: true,
      rosterName: true,
      eloRating: true,
      user: { select: { userId: true, userName: true } },
      killteam: { select: { killteamId: true, killteamName: true } },
    },
  },
} satisfies Prisma.MatchResultInclude

export type MatchResultRow = Prisma.MatchResultGetPayload<{ include: typeof matchResultInclude }>

type LiveRoster = MatchResultRow['rosterA']

type Snapshot = {
  rosterName: string
  userName: string
  killteamId: string
  killteamName: string
}

/*
  Prefer the live relation so renames show through; fall back to the snapshot
  once the roster (or its owner) is gone. A null rosterId tells the UI the side
  was deleted.
*/
function toRosterInfo(live: LiveRoster, snap: Snapshot): MatchResultRosterInfo {
  return {
    rosterId: live?.rosterId ?? null,
    userId: live?.user?.userId ?? null,
    rosterName: live?.rosterName ?? snap.rosterName,
    userName: live?.user?.userName ?? snap.userName,
    killteamId: live?.killteam?.killteamId ?? snap.killteamId,
    killteamName: live?.killteam?.killteamName ?? snap.killteamName,
  }
}

export function toMatchResult(row: MatchResultRow): MatchResult {
  // Prisma types `result` as a bare string. A value outside the union is a
  // data-integrity violation, not something to paper over.
  if (!isMatchOutcome(row.result)) {
    throw new Error(`MatchResult ${row.matchResultId} has an invalid result value: ${row.result}`)
  }

  return new MatchResult({
    matchResultId: row.matchResultId,
    result: row.result,
    rosterBConfirmed: row.rosterBConfirmed,
    matchDate: row.matchDate,
    rosterA: toRosterInfo(row.rosterA, {
      rosterName: row.rosterANameSnap,
      userName: row.rosterAUserNameSnap,
      killteamId: row.rosterAKillteamIdSnap,
      killteamName: row.rosterAKillteamNameSnap,
    }),
    rosterB: toRosterInfo(row.rosterB, {
      rosterName: row.rosterBNameSnap,
      userName: row.rosterBUserNameSnap,
      killteamId: row.rosterBKillteamIdSnap,
      killteamName: row.rosterBKillteamNameSnap,
    }),
    eloBeforeA: row.eloBeforeA,
    eloBeforeB: row.eloBeforeB,
    eloAfterA: row.eloAfterA,
    eloAfterB: row.eloAfterB,
  })
}

export class MatchResultRepository extends BaseRepository {
  async createMatchResult(data: Prisma.MatchResultUncheckedCreateInput): Promise<MatchResultRow> {
    return await this.prisma.matchResult.create({
      data,
      include: matchResultInclude,
    })
  }

  async getMatchResult(matchResultId: number): Promise<MatchResultRow | null> {
    return await this.prisma.matchResult.findUnique({
      where: { matchResultId },
      include: matchResultInclude,
    })
  }

  /*
    An unconfirmed result is an unverified claim by one party, so only the
    roster's owner sees it. Without this, anyone could paint losses onto any
    roster's public page and the public list would disagree with the public
    W/L/D tally.
  */
  async getMatchResultsForRoster(rosterId: string, includeUnconfirmed: boolean): Promise<MatchResultRow[]> {
    return await this.prisma.matchResult.findMany({
      where: {
        OR: [{ rosterAId: rosterId }, { rosterBId: rosterId }],
        ...(includeUnconfirmed ? {} : { rosterBConfirmed: true }),
      },
      include: matchResultInclude,
      orderBy: { matchDate: 'desc' },
    })
  }

  async confirmMatch(matchResultId: number): Promise<MatchResultRow> {
    return await this.prisma.matchResult.update({
      where: { matchResultId },
      data: { rosterBConfirmed: true },
      include: matchResultInclude,
    })
  }

  async deleteMatchResult(matchResultId: number): Promise<void> {
    await this.prisma.matchResult.delete({ where: { matchResultId } })
  }

  /*
    Per-opponent tallies for one killteam, from the snapshot columns. Reading the
    live relation instead would silently drop every match whose roster was later
    deleted (the FK is SetNull), so a killteam's record would shrink over time.

    The killteam can be in either slot, so this is two passes. Mirror matches are
    excluded from the second pass so they are not counted twice.
  */
  async getKillteamMatchupRows(killteamId: string, since: Date | null) {
    const confirmed = {
      rosterBConfirmed: true,
      ...(since ? { matchDate: { gte: since } } : {}),
    }

    return await Promise.all([
      this.prisma.matchResult.groupBy({
        by: ['rosterBKillteamIdSnap', 'result'],
        where: { ...confirmed, rosterAKillteamIdSnap: killteamId },
        _count: { _all: true },
      }),
      this.prisma.matchResult.groupBy({
        by: ['rosterAKillteamIdSnap', 'result'],
        where: {
          ...confirmed,
          rosterBKillteamIdSnap: killteamId,
          rosterAKillteamIdSnap: { not: killteamId },
        },
        _count: { _all: true },
      }),
    ])
  }

  /*
    The flooding guard counts by user pair, not roster pair: capping per roster
    pair is bypassed by reporting against each of a victim's rosters in turn.
  */
  async countPendingBetweenUsers(reporterUserId: string, opponentUserId: string): Promise<number> {
    return await this.prisma.matchResult.count({
      where: {
        rosterBConfirmed: false,
        rosterA: { userId: reporterUserId },
        rosterB: { userId: opponentUserId },
      },
    })
  }

  /*
    The duplicate warning matches on the roster pair in either slot order - two
    different rosters is a different game.
  */
  async findRecentBetweenRosters(rosterAId: string, rosterBId: string, since: Date): Promise<MatchResultRow | null> {
    return await this.prisma.matchResult.findFirst({
      where: {
        matchDate: { gte: since },
        OR: [
          { rosterAId, rosterBId },
          { rosterAId: rosterBId, rosterBId: rosterAId },
        ],
      },
      include: matchResultInclude,
      orderBy: { matchDate: 'desc' },
    })
  }
}
