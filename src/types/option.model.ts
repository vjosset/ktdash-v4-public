export type OptionPlain = {
  optionId: string
  opTypeId: string
  optionType: string
  seq: Number
  optionName: string
  description: string
  effects: string
}

export class Option {
  optionId: string
  opTypeId: string
  optionType: string
  seq: Number
  optionName: string
  description: string
  effects: string

  constructor(data: {
    optionId: string
    opTypeId: string
    optionType: string
    seq: Number
    optionName: string
    description: string
    effects: string
  }) {
    this.optionId = data.optionId
    this.opTypeId = data.opTypeId
    this.optionType = data.optionType
    this.seq = data.seq
    this.optionName = data.optionName
    this.description = data.description
    this.effects = data.effects
  }

  toPlain(): OptionPlain {
    return {
      optionId: this.optionId,
      opTypeId: this.opTypeId,
      optionType: this.optionType,
      seq: this.seq,
      optionName: this.optionName,
      description: this.description,
      effects: this.effects,
    }
  }
}
