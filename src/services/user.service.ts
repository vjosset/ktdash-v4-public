// @ts-nocheck
import { UserRepository } from '@/src/repositories/user.repository'
import { KillteamVoteService } from './killteamVote.service'
import { RosterIdentity, User } from '@/types'

export class UserService {
  private static repository = new UserRepository()

  static async getUserRow(userId: string): Promise<User | null> {
    const user = await this.repository.getUserRow(userId)
    if (!user) return null
    return new User(user)
  }

  static async getUser(userId: string): Promise<User | null> {
    const user = await this.repository.getUser(userId)
    return user ? new User(user) : null
  }

  static async getAllUsers(): Promise<User[]> {
    const users = await this.repository.getAllUsers()
    return users.map(user => new User(user))
  }

  // Null for a missing or private player - private players are found by roster ID only
  static async getRosterIdentitiesByUserName(userName: string): Promise<RosterIdentity[] | null> {
    return await this.repository.getRosterIdentitiesByUserName(userName)
  }

  static async getUserByUsername(userName: string, options?: { viewerUserId?: string }): Promise<User | null> {
    const user = await this.repository.getUserByUsername(userName)
    if (!user) return null

    const killteams = user.killteams || []
    const homebrewIds = killteams.filter(kt => kt?.factionId === 'HBR').map(kt => kt.killteamId)

    if (homebrewIds.length) {
      const [summaries, userVotes] = await Promise.all([
        KillteamVoteService.getSummaries(homebrewIds),
        options?.viewerUserId ? KillteamVoteService.getUserVotes(homebrewIds, options.viewerUserId) : {},
      ])

      user.killteams = killteams.map(kt => {
        if (kt.factionId !== 'HBR') return kt
        const enriched: any = {
          ...kt,
          voteSummary: summaries[kt.killteamId] ?? kt.voteSummary,
        }
        if (options?.viewerUserId) {
          enriched.userVote = userVotes[kt.killteamId] ?? null
        }
        return enriched
      })
    }

    return new User(user)
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    await this.repository.updateUser(userId, data)
    return await this.getUser(userId)
  }

  static async fixRosterSeqs(userId: string): Promise<null> {
    // Reorder/re-seq the user's rosters
    await this.repository.fixRosterSeqs(userId)
  }
}
