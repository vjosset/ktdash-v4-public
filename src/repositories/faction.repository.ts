import type { Faction } from '@prisma/client'
import { BaseRepository } from './base.repository'

export class FactionRepository extends BaseRepository {
  async getFactionRow(factionId: string): Promise<Faction | null> {
    return this.prisma.faction.findUnique({
      where: { factionId }
    })
  }

  async getFaction(factionId: string) {
    return this.prisma.faction.findUnique({
      where: { factionId },
      include: { killteams: {
        orderBy: [
          {seq: 'asc'},
          {killteamName: 'asc'}
        ]}
      }
    })
  }

  async getAllFactions() {
    return this.prisma.faction.findMany({
      orderBy: { seq: 'asc' },
      include: {
        killteams: true
      }
    })
  }
  
  async getAllFactionsWithDetails() {
    return this.prisma.faction.findMany({
      orderBy: { seq: 'asc' },
      include: {
        killteams: {
          include: {
            opTypes: {
              orderBy: { seq: 'asc' },
              include: {
                weapons: {
                  orderBy: { seq: 'asc' },
                  include: { profiles: true }
                },
                options: {
                  orderBy: { seq: 'asc' }
                },
                abilities: true
              }
            }
          },
          orderBy: [
            {seq: 'asc'},
            {killteamName: 'asc'}
          ]
        }
      }
    })
  }
}
