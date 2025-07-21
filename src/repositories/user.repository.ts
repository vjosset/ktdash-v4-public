import type { User } from '@prisma/client'
import { BaseRepository } from './base.repository'

export class UserRepository extends BaseRepository {
  async getUserRow(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { userId }
    })
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
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
    return this.prisma.user.findUnique({
      where: { userName },
      include: {
        rosters: {
          include: {
            killteam: true
          },
          orderBy: { seq: 'asc' }
        }
      }
    })
  }
}
