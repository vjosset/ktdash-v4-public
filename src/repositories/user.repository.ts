import type { RosterIdentity } from '@/types'
import type { User } from '@prisma/client'
import { BaseRepository } from './base.repository'

export class UserRepository extends BaseRepository {
  /*
    A player's rosters as identities, in their own display order. Deliberately
    lean: getUserByUsername() pulls every killteam row, which the opponent
    picker does not need.
  */
  async getRosterIdentitiesByUserName(userName: string): Promise<RosterIdentity[] | null> {
    // findFirst rather than findUnique, matching getUserByUsername below
    const user = await this.prisma.user.findFirst({
      where: { userName: decodeURIComponent(userName) },
      select: {
        userId: true,
        userName: true,
        isPrivate: true,
        rosters: {
          select: {
            rosterId: true,
            rosterName: true,
            killteamId: true,
            killteam: { select: { killteamName: true } },
          },
          orderBy: { seq: 'asc' },
        },
      },
    })

    // A private player is findable by roster ID only - never by name. Reported
    // exactly like a missing user so the lookup does not confirm they exist.
    if (!user || user.isPrivate) return null

    return user.rosters.map(roster => ({
      rosterId: roster.rosterId,
      userId: user.userId,
      rosterName: roster.rosterName,
      userName: user.userName,
      killteamId: roster.killteamId,
      killteamName: roster.killteam?.killteamName ?? '',
    }))
  }

  async getPrivateUserIds(userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) return new Set()
    const rows = await this.prisma.user.findMany({
      where: { userId: { in: userIds }, isPrivate: true },
      select: { userId: true },
    })
    return new Set(rows.map(row => row.userId))
  }

  async getUserRow(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { userId }
    })
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        killteams: true,
        rosters: true
      }
      //include: {
      //  rosters: {
      //    include: {
      //      killteam: true
      //    },
      //    orderBy: { seq: 'asc' }
      //  }
      //}
    })
  }

  async getUserByUsername(userName: string) {
    // Use findFirst instead of findUnique because findFirst uses case-sensitive matching
    // Decode in case Next.js passes the URL-encoded param without decoding it first
    const decoded = decodeURIComponent(userName)
    return this.prisma.user.findFirst({
      where: { userName: decoded },
      include: {
        rosters: {
          include: {
            killteam: true,
            user: {
              select: {
                userId: true,
                userName: true
              }
            }
          },
          orderBy: { seq: 'asc' }
        },
        killteams: true
      }
    })
  }
}
