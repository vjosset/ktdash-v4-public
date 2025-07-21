// @ts-nocheck
import { FactionRepository } from '@/src/repositories/faction.repository'
import { Faction } from '@/types'

export class FactionService {
  private static repository = new FactionRepository()

  static async getFactionRow(factionId: string): Promise<Faction | null> {
    const faction = await this.repository.getFactionRow(factionId)
    return faction ? new Faction(faction) : null
  }

  static async getFaction(factionId: string): Promise<Faction | null> {
    const faction = await this.repository.getFaction(factionId)
    return faction ? new Faction(faction) : null
  }

  static async getAllFactions(): Promise<Faction[]> {
    const factions = await this.repository.getAllFactions()
    return factions.map(faction => new Faction(faction))
  }

  static async getAllFactionsWithDetails(): Promise<Faction[]> {
    const factions = await this.repository.getAllFactionsWithDetails()
    return factions.map(faction => new Faction(faction))
  }
}
