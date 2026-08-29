import { KillteamRepository } from '@/src/repositories/killteam.repository'
import { MatchResultRepository, toMatchResult } from '@/src/repositories/matchResult.repository'
import { RosterRepository } from '@/src/repositories/roster.repository'
import { KillteamMatchStats, KillteamMatchup, MATCH_STATS_PERIOD, MatchOutcome, MatchResult, MatchResultPlain, MatchStatsPeriod, RosterIdentity } from '@/types'

/*
  Guards from the spec's rules 6 and 7. The cap is what prevents queue-flooding
  now that disputed rows leave no trace behind them.
*/
const PERIOD_MONTHS: Record<MatchStatsPeriod, number | null> = {
  [MATCH_STATS_PERIOD.ALL]: null,
  [MATCH_STATS_PERIOD.SIX_MONTHS]: 6,
  [MATCH_STATS_PERIOD.THREE_MONTHS]: 3,
  [MATCH_STATS_PERIOD.ONE_MONTH]: 1,
}

export const PENDING_REPORT_CAP = 3
export const DUPLICATE_WARNING_HOURS = 12

export type CreateMatchResultOutcome =
  | { ok: true; matchResult: MatchResult }
  | { ok: false; status: number; error: string; duplicateOf?: MatchResultPlain }

export class MatchResultService {
  private static repository = new MatchResultRepository()
  private static rosterRepository = new RosterRepository()
  private static killteamRepository = new KillteamRepository()

  static async getMatchResult(matchResultId: number): Promise<MatchResult | null> {
    const row = await this.repository.getMatchResult(matchResultId)
    return row ? toMatchResult(row) : null
  }

  /*
    Viewer-aware: the owner of the roster also sees results still awaiting
    confirmation. Everyone else sees confirmed results only.
  */
  static async getMatchResultsForRoster(rosterId: string, viewerUserId?: string | null): Promise<MatchResult[]> {
    const identity = await this.rosterRepository.getRosterIdentityRow(rosterId)
    if (!identity) return []

    const isOwner = !!viewerUserId && identity.userId === viewerUserId
    const rows = await this.repository.getMatchResultsForRoster(rosterId, isOwner)
    return rows.map(toMatchResult)
  }

  static async createMatchResult(params: {
    rosterA: RosterIdentity
    rosterB: RosterIdentity
    result: MatchOutcome
    acknowledgeDuplicate?: boolean
  }): Promise<CreateMatchResultOutcome> {
    const { rosterA, rosterB, result, acknowledgeDuplicate } = params

    if (rosterA.rosterId === rosterB.rosterId) {
      return { ok: false, status: 400, error: 'A roster cannot fight itself.' }
    }

    // Rule 2: a match result is an attestation between two people
    if (rosterA.userId === rosterB.userId) {
      return { ok: false, status: 400, error: 'Both rosters belong to the same player.' }
    }

    // Rule 6
    const pending = await this.repository.countPendingBetweenUsers(rosterA.userId, rosterB.userId)
    if (pending >= PENDING_REPORT_CAP) {
      return {
        ok: false,
        status: 429,
        error: `You already have ${pending} results awaiting this player's confirmation. Wait for those before reporting another.`,
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
          error: 'These two rosters already have a result reported recently.',
          duplicateOf: toMatchResult(recent).toPlain(),
        }
      }
    }

    const row = await this.repository.createMatchResult({
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

    return { ok: true, matchResult: toMatchResult(row) }
  }

  /*
    A killteam's record against every official killteam it has faced. Homebrew
    opponents are left out of both the rows and the totals, so the table always
    sums to the headline record.
  */
  static async getKillteamMatchStats(
    killteamId: string,
    period: MatchStatsPeriod = MATCH_STATS_PERIOD.ALL,
  ): Promise<KillteamMatchStats> {
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
    let mirrorGames = 0

    const add = (opponentId: string, result: string, thisSlot: 'A' | 'B', count: number) => {
      const entry = tally.get(opponentId) ?? { wins: 0, losses: 0, draws: 0 }
      if (result === 'D') entry.draws += count
      else if (result === thisSlot) entry.wins += count
      else entry.losses += count
      tally.set(opponentId, entry)
    }

    asA.forEach(row => {
      const count = row._count._all
      // Mirror matches only appear in this pass; the second pass filters them out
      if (row.rosterBKillteamIdSnap === killteamId) {
        mirrorGames += count
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
        games: entry.wins + entry.losses + entry.draws,
      }
    })

    return {
      wins: matchups.reduce((sum, m) => sum + m.wins, 0),
      losses: matchups.reduce((sum, m) => sum + m.losses, 0),
      draws: matchups.reduce((sum, m) => sum + m.draws, 0),
      games: matchups.reduce((sum, m) => sum + m.games, 0),
      mirrorGames,
      matchups: matchups.sort((a, b) => b.games - a.games),
    }
  }

  static async confirmMatch(matchResultId: number): Promise<MatchResult> {
    const row = await this.repository.confirmMatch(matchResultId)
    return toMatchResult(row)
  }

  static async deleteMatchResult(matchResultId: number): Promise<void> {
    await this.repository.deleteMatchResult(matchResultId)
  }
}
