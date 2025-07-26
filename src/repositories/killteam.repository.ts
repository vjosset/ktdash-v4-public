import type { Killteam } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class KillteamRepository extends BaseRepository {
  async getKillteamRow(killteamId: string): Promise<Killteam | null> {
    return this.prisma.killteam.findUnique({
      where: { killteamId }
    })
  }

  async getKillteam(killteamId: string) {
    const killteam = await this.prisma.killteam.findUnique({
      where: {
        killteamId
      },
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
            options: {
              orderBy:[
                { seq: 'asc' },
              ]
            },
            abilities: true,
          },
          orderBy: { seq: 'asc' }
        },
        ploys: {
          orderBy: [
            { ployType: 'asc' },
            { seq: 'asc' }
          ]
        },
        rosters: {
          where: {
            rosterId: killteamId
          },
          take: 1
        }
      }
    })

    if (!killteam) return null;

    // Fetch equipments separately to handle the universal ones (killteamid NULL means universal)
    const equipments = await this.prisma.equipment.findMany({
      where: {
        OR: [
          { killteamId: killteam.killteamId },
          { killteamId: null }
        ]
      },
      orderBy: { seq: 'asc' }
    });

    // Inject manually
    return {
      ...killteam,
      equipments,
      defaultRoster: killteam.rosters[0] || null
    };
  }

  async getAllKillteams() {
    const killteams = await this.prisma.killteam.findMany({
      orderBy: [{ seq: 'asc' }, { killteamName: 'asc' }],
    });

    const killteamsWithDefaultRosters = await Promise.all(
      killteams.map(async (killteam) => {
        const defaultRoster = await this.prisma.roster.findFirst({
          where: { rosterId: killteam.killteamId },
        });

        return {
          ...killteam,
          defaultRoster,
        };
      })
    );

    return killteamsWithDefaultRosters;
  }
}
