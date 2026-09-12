import { KillteamRepository } from '@/src/repositories/killteam.repository'
import { BattleRepository, toBattle } from '@/src/repositories/battle.repository'
import { RosterRepository } from '@/src/repositories/roster.repository'
import { KillteamBattleRecord, KillteamBattleStats, KillteamMatchup, BATTLE_STATS_PERIOD, BattleOutcome, Battle, BattlePlain, BattleStatsPeriod, RosterIdentity } from '@/types'

/*
  Guards from the spec's rules 6 and 7. The cap is what prevents queue-flooding
  now that disputed rows leave no trace behind them.
*/
const PERIOD_MONTHS: Record<BattleStatsPeriod, number | null> = {
  [BATTLE_STATS_PERIOD.ALL]: null,
  [BATTLE_STATS_PERIOD.SIX_MONTHS]: 6,
  [BATTLE_STATS_PERIOD.THREE_MONTHS]: 3,
  [BATTLE_STATS_PERIOD.ONE_MONTH]: 1,
}

export const PENDING_REPORT_CAP = 3
export const DUPLICATE_WARNING_HOURS = 12

export type CreateBattleOutcome =
  | { ok: true; battle: Battle }
  | { ok: false; status: number; error: string; duplicateOf?: BattlePlain }

export class BattleService {
  private static repository = new BattleRepository()
  private static rosterRepository = new RosterRepository()
  private static killteamRepository = new KillteamRepository()

  static async getBattle(battleId: number): Promise<Battle | null> {
    const row = await this.repository.getBattle(battleId)
    return row ? toBattle(row) : null
  }

  /*
    Viewer-aware: the owner of the roster also sees results still awaiting
    confirmation. Everyone else sees confirmed results only.
  */
  static async getBattlesForRoster(rosterId: string, viewerUserId?: string | null): Promise<Battle[]> {
    const identity = await this.rosterRepository.getRosterIdentityRow(rosterId)
    if (!identity) return []

    const isOwner = !!viewerUserId && identity.userId === viewerUserId
    const rows = await this.repository.getBattlesForRoster(rosterId, isOwner)
    return rows.map(toBattle)
  }

  /*
    Viewer-aware, like getBattlesForRoster: the user themselves also sees battles
    still awaiting confirmation. Everyone else, signed in or not, sees confirmed
    battles only.
  */
  static async getBattlesForUser(userId: string, viewerUserId?: string | null): Promise<Battle[]> {
    const isSelf = !!viewerUserId && viewerUserId === userId
    const rows = await this.repository.getBattlesForUser(userId, isSelf)
    return rows.map(toBattle)
  }

  static async createBattle(params: {
    rosterA: RosterIdentity
    rosterB: RosterIdentity
    result: BattleOutcome
    acknowledgeDuplicate?: boolean
  }): Promise<CreateBattleOutcome> {
    const { rosterA, rosterB, result, acknowledgeDuplicate } = params

    if (rosterA.rosterId === rosterB.rosterId) {
      return { ok: false, status: 400, error: 'A roster cannot fight itself.' }
    }

    // Rule 2: a battle is an attestation between two people
    if (rosterA.userId === rosterB.userId) {
      return { ok: false, status: 400, error: 'Both rosters belong to the same player.' }
    }

    // Rule 6
    const pending = await this.repository.countPendingBetweenUsers(rosterA.userId, rosterB.userId)
    if (pending >= PENDING_REPORT_CAP) {
      return {
        ok: false,
        status: 429,
        error: `You already have ${pending} battles awaiting this player's confirmation. Wait for those before reporting another.`,
      }
    }

    // Rule 7: warn, but do not block
    if (!acknowledgeDuplicate) {
      const since = new Date(Date.now() - DUPLICATE_WARNING_HOURS * 60 * 60 * 1000)
      const recent = await this.repository.findRecentBetweenRosters(rosterA.rosterId, rosterB.rosterId, since)
      if (recent) {
        return {
          ok: false,
          status: 409,
          error: 'These two rosters already have a battle reported recently.',
          duplicateOf: toBattle(recent).toPlain(),
        }
      }
    }

    const row = await this.repository.createBattle({
      rosterAId: rosterA.rosterId,
      rosterBId: rosterB.rosterId,
      result,
      rosterANameSnap: rosterA.rosterName,
      rosterAUserNameSnap: rosterA.userName,
      rosterAKillteamIdSnap: rosterA.killteamId,
      rosterAKillteamNameSnap: rosterA.killteamName,
      rosterBNameSnap: rosterB.rosterName,
      rosterBUserNameSnap: rosterB.userName,
      rosterBKillteamIdSnap: rosterB.killteamId,
      rosterBKillteamNameSnap: rosterB.killteamName,
    })

    return { ok: true, battle: toBattle(row) }
  }

  /*
    A killteam's record against every official killteam it has faced. Homebrew
    opponents are left out of both the rows and the totals, so the table always
    sums to the headline record.
  */
  static async getKillteamBattleStats(
    killteamId: string,
    period: BattleStatsPeriod = BATTLE_STATS_PERIOD.ALL,
  ): Promise<KillteamBattleStats> {
    const months = PERIOD_MONTHS[period]
    let since: Date | null = null
    if (months !== null) {
      since = new Date()
      const dayOfMonth = since.getDate()
      since.setMonth(since.getMonth() - months)
      // setMonth overflows rather than clamping: 31 March minus one month lands
      // on 3 March, not 28 February. Roll back to the last day of the intended
      // month so "last month" is a month on 31-day months too.
      if (since.getDate() !== dayOfMonth) since.setDate(0)
    }

    const [asA, asB] = await this.repository.getKillteamMatchupRows(killteamId, since)

    const tally = new Map<string, { wins: number; losses: number; draws: number }>()
    let mirrorBattles = 0

    const add = (opponentId: string, result: string, thisSlot: 'A' | 'B', count: number) => {
      const entry = tally.get(opponentId) ?? { wins: 0, losses: 0, draws: 0 }
      if (result === 'D') entry.draws += count
      else if (result === thisSlot) entry.wins += count
      else entry.losses += count
      tally.set(opponentId, entry)
    }

    asA.forEach(row => {
      const count = row._count._all
      // Mirror battles only appear in this pass; the second pass filters them out
      if (row.rosterBKillteamIdSnap === killteamId) {
        mirrorBattles += count
        return
      }
      add(row.rosterBKillteamIdSnap, row.result, 'A', count)
    })

    asB.forEach(row => add(row.rosterAKillteamIdSnap, row.result, 'B', row._count._all))

    // Resolving against the live Killteam table is what drops homebrew opponents:
    // factionId is the authority on homebrew, not the id.
    const officialRows = await this.killteamRepository.getOfficialKillteamNameRows([...tally.keys()])

    const matchups: KillteamMatchup[] = officialRows.map(({ killteamId: opponentId, killteamName }) => {
      const entry = tally.get(opponentId) ?? { wins: 0, losses: 0, draws: 0 }
      return {
        killteamId: opponentId,
        killteamName,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        battles: entry.wins + entry.losses + entry.draws,
      }
    })

    return {
      wins: matchups.reduce((sum, m) => sum + m.wins, 0),
      losses: matchups.reduce((sum, m) => sum + m.losses, 0),
      draws: matchups.reduce((sum, m) => sum + m.draws, 0),
      battles: matchups.reduce((sum, m) => sum + m.battles, 0),
      mirrorBattles,
      matchups: matchups.sort((a, b) => b.battles - a.battles),
    }
  }

  /*
    Newest battles site-wide for the admin view, confirmed and pending alike.
    Not viewer-aware - callers are responsible for restricting this to admins.
  */
  static async getRecentBattles(limit: number): Promise<Battle[]> {
    const rows = await this.repository.getRecentBattles(limit)
    return rows.map(toBattle)
  }

  /*
    Every official killteam's all-time record, for the killteams index. Applies
    the same two exclusions as getKillteamBattleStats - mirrors, and any battle
    involving a homebrew team - so a killteam's win rate here agrees with the one
    on its own page. Teams with no qualifying battles are simply absent.
  */
  static async getAllKillteamBattleRecords(): Promise<KillteamBattleRecord[]> {
    const rows = await this.repository.getAllKillteamMatchupRows()

    const seen = new Set<string>()
    rows.forEach(row => {
      seen.add(row.rosterAKillteamIdSnap)
      seen.add(row.rosterBKillteamIdSnap)
    })

    // factionId is the authority on homebrew, not the id, so this has to resolve
    // against the live Killteam table
    const officialRows = await this.killteamRepository.getOfficialKillteamNameRows([...seen])
    const official = new Set(officialRows.map(row => row.killteamId))

    const tally = new Map<string, { wins: number; losses: number; draws: number }>()

    const add = (killteamId: string, result: string, thisSlot: 'A' | 'B', count: number) => {
      const entry = tally.get(killteamId) ?? { wins: 0, losses: 0, draws: 0 }
      if (result === 'D') entry.draws += count
      else if (result === thisSlot) entry.wins += count
      else entry.losses += count
      tally.set(killteamId, entry)
    }

    rows.forEach(row => {
      const a = row.rosterAKillteamIdSnap
      const b = row.rosterBKillteamIdSnap

      // A mirror is a win and a loss at once, so it says nothing about the team
      if (a === b) return
      // A battle involving homebrew counts for neither side
      if (!official.has(a) || !official.has(b)) return

      add(a, row.result, 'A', row._count._all)
      add(b, row.result, 'B', row._count._all)
    })

    return [...tally.entries()].map(([killteamId, entry]) => ({
      killteamId,
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      battles: entry.wins + entry.losses + entry.draws,
    }))
  }

  static async confirmBattle(battleId: number): Promise<Battle> {
    const row = await this.repository.confirmBattle(battleId)
    return toBattle(row)
  }

  static async deleteBattle(battleId: number): Promise<void> {
    await this.repository.deleteBattle(battleId)
  }
}
