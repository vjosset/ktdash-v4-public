export type AbilityPlain = {
  abilityId: string
  opTypeId: string
  abilityName: string
  AP?: number
  description: string
}

export class Ability {
  abilityId: string
  opTypeId: string
  abilityName: string
  AP?: number
  description: string

  constructor(data: {
    abilityId: string
    opTypeId: string
    abilityName: string
    AP?: number
    description: string
  }) {
    this.abilityId = data.abilityId
    this.opTypeId = data.opTypeId
    this.abilityName = data.abilityName
    this.AP = data.AP
    this.description = data.description
  }

  toPlain(): AbilityPlain {
    return {
      abilityId: this.abilityId,
      opTypeId: this.opTypeId,
      abilityName: this.abilityName,
      AP: this.AP,
      description: this.description
    }
  }
}
