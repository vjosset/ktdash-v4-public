import { OpType, OpTypePlain, Roster, RosterPlain } from '.'
import { Equipment, EquipmentPlain } from './equipment.model'
import { Ploy, PloyPlain } from './ploy.model'

export type KillteamPlain = {
  killteamId: string
  killteamName: string
  description: string
  composition: string
  archetypes?: string
  defaultRoster?: RosterPlain | null
  opTypes: OpTypePlain[]
  ploys: PloyPlain[]
  equipments: EquipmentPlain[]
}

export class Killteam {
  killteamId: string
  killteamName: string
  description: string
  composition: string
  archetypes?: string
  defaultRoster?: Roster | null
  opTypes: OpType[]
  ploys: Ploy[]
  equipments: Equipment[]

  constructor(data: {
    killteamId: string
    killteamName: string
    description: string
    composition: string
    archetypes?: string
    defaultRoster?: Roster | null
    opTypes: OpType[]
    ploys: Ploy[]
    equipments: Equipment[]
  }) {
    this.killteamId = data.killteamId
    this.killteamName = data.killteamName
    this.description = data.description
    this.composition = data.composition
    this.archetypes = data.archetypes
    this.defaultRoster = data.defaultRoster ? (data.defaultRoster instanceof Roster ? data.defaultRoster : new Roster(data.defaultRoster)) : null
    this.opTypes = data.opTypes?.map(opType => opType instanceof OpType ? opType : new OpType(opType))
    this.ploys = data.ploys?.map(ploy => ploy instanceof Ploy ? ploy : new Ploy(ploy))
    this.equipments = data.equipments?.map(eq => eq instanceof Equipment ? eq : new Equipment(eq))
  }

  toPlain(): KillteamPlain {
    return {
      killteamId: this.killteamId,
      killteamName: this.killteamName,
      description: this.description,
      composition: this.composition,
      archetypes: this.archetypes,
      defaultRoster: this.defaultRoster?.toPlain() ?? null,
      opTypes: this.opTypes?.map((opType) => opType.toPlain()),
      ploys: this.ploys?.map((ploy) => ploy.toPlain()),
      equipments: this.equipments?.map((eq) => eq.toPlain()),
    }
  }
}
