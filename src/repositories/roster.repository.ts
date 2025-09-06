import type { Roster } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RosterRepository extends BaseRepository {
  async getRosterRow(rosterId: string): Promise<Roster | null> {
    return await this.prisma.roster.findUnique({
      where: { rosterId }
    })
  }

  async getRoster(rosterId: string): Promise<Roster | null> {
    const roster = await this.prisma.roster.findUnique({
      where: { rosterId },
      include: {
        killteam: {
          include: {
            opTypes: {
              include: {
                weapons: {
                  include: {
                    profiles: {
                      orderBy: { seq: 'asc' }
                    }
                  },
                  orderBy:[
                    { wepType: 'desc'},
                    { seq: 'asc' },
                  ]
                },
                abilities: true,
              }
            },
            ploys: {
              orderBy: [
                { ployType: 'asc' },
                { seq: 'asc' }
              ]
            }
          }
        },
        user: true,
        ops: {
          include: {
            opType: {
              include: {
                weapons: {
                  include: {
                    profiles: {
                      orderBy: { seq: 'asc' }
                    }
                  },
                  orderBy:[
                    { wepType: 'desc'},
                    { seq: 'asc' },
                  ]
                },
                options: {
                  orderBy:[
                    { seq: 'asc'},
                  ]
                },
                abilities: true,
              }
            }
          },
          orderBy: {seq: 'asc'}
        }
      }
    })

    if (!roster?.killteam) return roster;

    // Fetch equipments separately to handle the universal ones (killteamid NULL means universal)
    const equipments = await this.prisma.equipment.findMany({
      where: {
        OR: [
          { killteamId: roster.killteam.killteamId },
          { killteamId: null }
        ]
      },
      orderBy: { seq: 'asc' }
    });

    // Inject manually
    return {
      ...roster,
      killteam: {
        ...roster.killteam,
        equipments
      }
    };
  }

  async getRandomSpotlightRosterId(): Promise<string | null> {
    const spotlightRosters = await this.prisma.roster.findMany({
      where: { isSpotlight: true },
      select: { rosterId: true }, // Just get IDs first to reduce payload
    });

    if (spotlightRosters.length === 0) return null

    const randomIndex = Math.floor(Math.random() * spotlightRosters.length)
    return spotlightRosters[randomIndex].rosterId
  }

  async createRoster(data: Partial<Roster>): Promise<Roster> {
    return await this.prisma.roster.create({ data })
  }

  async updateRoster(rosterId: string, data: Partial<Roster>): Promise<Roster | null> {
    return await this.prisma.roster.update({
      where: { rosterId },
      data
    })
  }

  async deleteRoster(rosterId: string): Promise<void> {
    await this.prisma.roster.delete({ where: { rosterId } })
  }

  async resetRosterActivation(rosterId: string): Promise<void> {
    await this.prisma.op.updateMany({
      where: { rosterId },
      data: { isActivated: false }
    })
  }

  async incrementRosterViewCount(rosterId): Promise<void> {
    await this.prisma.roster.update({
      where: { rosterId },
      data: {
        viewCount: { increment: 1 }
      }
    })
  }

  async incrementRosterImportCount(rosterId): Promise<void> {
    await this.prisma.roster.update({
      where: { rosterId },
      data: {
        importCount: { increment: 1 }
      }
    })
  }
}
