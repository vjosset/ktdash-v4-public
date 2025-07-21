// @ts-nocheck
import { KillteamRepository } from '@/src/repositories/killteam.repository'
import { Killteam } from '@/types'

export class KillteamService {
  private static repository = new KillteamRepository()

  static async getKillteamRow(killteamId: string): Promise<Killteam | null> {
    const killteam = await this.repository.getKillteamRow(killteamId)
    return killteam ? new Killteam(killteam) : null
  }

  static async getKillteam(killteamId: string): Promise<Killteam | null> {
    const killteam = await this.repository.getKillteam(killteamId)
    return killteam ? new Killteam(killteam) : null
  }

  static async getAllKillteams(): Promise<Killteam[]> {
    const killteams = await this.repository.getAllKillteams()
    return killteams.map(killteam => new Killteam(killteam))
  }
}
