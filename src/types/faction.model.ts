import { Killteam, KillteamPlain } from '.'

export type FactionPlain = {
  factionId: string
  factionName: string
  description: string
  factioncomp: string
  killteams: KillteamPlain[]
}

export class Faction {
  factionId: string
  factionName: string
  description: string
  factioncomp: string
  killteams: Killteam[]

  constructor(data: {
    factionId: string
    factionName: string
    description: string
    factioncomp: string
    killteams: Killteam[]
  }) {
    this.factionId = data.factionId
    this.factionName = data.factionName
    this.description = data.description
    this.factioncomp = data.factioncomp
    this.killteams = data.killteams?.map(killteam => killteam instanceof Killteam ? killteam : new Killteam(killteam))
  }

  toPlain(): FactionPlain {
    return {
      factionId: this.factionId,
      factionName: this.factionName,
      description: this.description,
      factioncomp: this.factioncomp,
      killteams: this.killteams?.map((killteam) => killteam.toPlain()),
    }
  }
}
