import { Battle, BattleRosterInfo, isBattleOutcome } from '@/types'
import type { Prisma } from '@prisma/client'
import { BaseRepository } from './base.repository'

/*
  Both sides are pulled with their user and killteam so display can prefer the
  live relation over the snapshot. Nothing here needs the roster's ops.
*/
const battleInclude = {
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
} satisfies Prisma.BattleInclude

export type BattleRow = Prisma.BattleGetPayload<{ include: typeof battleInclude }>

type LiveRoster = BattleRow['rosterA']

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
function toRosterInfo(live: LiveRoster, snap: Snapshot): BattleRosterInfo {
  return {
    rosterId: live?.rosterId ?? null,
    userId: live?.user?.userId ?? null,
    rosterName: live?.rosterName ?? snap.rosterName,
    userName: live?.user?.userName ?? snap.userName,
    killteamId: live?.killteam?.killteamId ?? snap.killteamId,
    killteamName: live?.killteam?.killteamName ?? snap.killteamName,
  }
}

export function toBattle(row: BattleRow): Battle {
  // Prisma types `result` as a bare string. A value outside the union is a
  // data-integrity violation, not something to paper over.
  if (!isBattleOutcome(row.result)) {
    throw new Error(`Battle ${row.battleId} has an invalid result value: ${row.result}`)
  }

  return new Battle({
    battleId: row.battleId,
    result: row.result,
    rosterBConfirmed: row.rosterBConfirmed,
    battleDate: row.battleDate,
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

export class BattleRepository extends BaseRepository {
  async createBattle(data: Prisma.BattleUncheckedCreateInput): Promise<BattleRow> {
    return await this.prisma.battle.create({
      data,
      include: battleInclude,
    })
  }

  async getBattle(battleId: number): Promise<BattleRow | null> {
    return await this.prisma.battle.findUnique({
      where: { battleId },
      include: battleInclude,
    })
  }

  /*
    An unconfirmed battle is an unverified claim by one party, so only the
    roster's owner sees it. Without this, anyone could paint losses onto any
    roster's public page and the public list would disagree with the public
    W/L/D tally.
  */
  async getBattlesForRoster(rosterId: string, includeUnconfirmed: boolean): Promise<BattleRow[]> {
    return await this.prisma.battle.findMany({
      where: {
        OR: [{ rosterAId: rosterId }, { rosterBId: rosterId }],
        ...(includeUnconfirmed ? {} : { rosterBConfirmed: true }),
      },
      include: battleInclude,
      orderBy: { battleDate: 'desc' },
    })
  }

  /*
    Every battle any of a user's rosters fought, in either slot. Matched on the
    live roster relation, not the userName snapshot: a snapshot follows the name
    rather than the person, so a renamed account would lose its record and a
    reused name would inherit someone else's. The cost is that a battle whose
    roster has since been deleted drops off the user's list.
  */
  async getBattlesForUser(userId: string, includeUnconfirmed: boolean): Promise<BattleRow[]> {
    return await this.prisma.battle.findMany({
      where: {
        OR: [{ rosterA: { userId } }, { rosterB: { userId } }],
        ...(includeUnconfirmed ? {} : { rosterBConfirmed: true }),
      },
      include: battleInclude,
      orderBy: { battleDate: 'desc' },
    })
  }

  /*
    Newest battles site-wide, for the admin view. Unconfirmed rows are included
    on purpose: a report stuck awaiting confirmation is exactly the thing an
    admin wants to see, and there is no roster whose owner's privacy to respect
    here the way getBattlesForRoster has to.
  */
  async getRecentBattles(limit: number): Promise<BattleRow[]> {
    return await this.prisma.battle.findMany({
      include: battleInclude,
      orderBy: { battleDate: 'desc' },
      take: limit,
    })
  }

  async confirmBattle(battleId: number): Promise<BattleRow> {
    return await this.prisma.battle.update({
      where: { battleId },
      data: { rosterBConfirmed: true },
      include: battleInclude,
    })
  }

  async deleteBattle(battleId: number): Promise<void> {
    await this.prisma.battle.delete({ where: { battleId } })
  }

  /*
    Per-opponent tallies for one killteam, from the snapshot columns. Reading the
    live relation instead would silently drop every battle whose roster was later
    deleted (the FK is SetNull), so a killteam's record would shrink over time.

    The killteam can be in either slot, so this is two passes. Mirror battles are
    excluded from the second pass so they are not counted twice.
  */
  async getKillteamMatchupRows(killteamId: string, since: Date | null) {
    const confirmed = {
      rosterBConfirmed: true,
      ...(since ? { battleDate: { gte: since } } : {}),
    }

    return await Promise.all([
      this.prisma.battle.groupBy({
        by: ['rosterBKillteamIdSnap', 'result'],
        where: { ...confirmed, rosterAKillteamIdSnap: killteamId },
        _count: { _all: true },
      }),
      this.prisma.battle.groupBy({
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
    Every confirmed battle, grouped by the two killteams that fought it. The
    killteams index needs a row per team, so this is one query for the whole
    site rather than the per-killteam pair above. Grouping by both sides is what
    lets the caller drop mirrors and homebrew battles, which it cannot do from a
    single-sided grouping.
  */
  async getAllKillteamMatchupRows() {
    return await this.prisma.battle.groupBy({
      by: ['rosterAKillteamIdSnap', 'rosterBKillteamIdSnap', 'result'],
      where: { rosterBConfirmed: true },
      _count: { _all: true },
    })
  }

  /*
    The flooding guard counts by user pair, not roster pair: capping per roster
    pair is bypassed by reporting against each of a victim's rosters in turn.
  */
  async countPendingBetweenUsers(reporterUserId: string, opponentUserId: string): Promise<number> {
    return await this.prisma.battle.count({
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
  async findRecentBetweenRosters(rosterAId: string, rosterBId: string, since: Date): Promise<BattleRow | null> {
    return await this.prisma.battle.findFirst({
      where: {
        battleDate: { gte: since },
        OR: [
          { rosterAId, rosterBId },
          { rosterAId: rosterBId, rosterBId: rosterAId },
        ],
      },
      include: battleInclude,
      orderBy: { battleDate: 'desc' },
    })
  }
}
