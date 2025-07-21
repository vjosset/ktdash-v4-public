export type EquipmentPlain = {
  eqId: string
  killteamId: string
  equipmentType: string
  seq: Number
  eqName: string
  description: string
  effects: string
}

export class Equipment {
  eqId: string
  killteamId: string
  equipmentType: string
  seq: Number
  eqName: string
  description: string
  effects: string

  constructor(data: {
    eqId: string
    killteamId: string
    equipmentType: string
    seq: Number
    eqName: string
    description: string
    effects: string
  }) {
    this.eqId = data.eqId
    this.killteamId = data.killteamId
    this.equipmentType = data.equipmentType
    this.seq = data.seq
    this.eqName = data.eqName
    this.description = data.description
    this.effects = data.effects
  }

  toPlain(): EquipmentPlain {
    return {
      eqId: this.eqId,
      killteamId: this.killteamId,
      equipmentType: this.equipmentType,
      seq: this.seq,
      eqName: this.eqName,
      description: this.description,
      effects: this.effects
    }
  }
}
