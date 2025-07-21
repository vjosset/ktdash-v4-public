import { prisma } from '@/src/lib/prisma'
import type { PrismaClient } from '@prisma/client'

export abstract class BaseRepository {
  protected prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }
  
  async fixRosterSeqs(userId: string) {
    // Reorder/re-seq the user's squads
    if (!userId) {
      throw 'Missing required input userId'
    }
    const squads = await this.prisma.roster.findMany({
      where: { userId: userId },
      orderBy: [{ seq: 'asc' }]
    })

    await Promise.all(
      squads.map((roster, index) =>
        this.prisma.roster.update({
          where: { rosterId: roster.rosterId },
          data: { seq: index + 1 }
        })
      )
    )
  }
}
