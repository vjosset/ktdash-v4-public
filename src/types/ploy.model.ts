export type PloyPlain = {
  ployId: string
  killteamId: string
  ployType: string
  seq: Number
  ployName: string
  description: string
}

export class Ploy {
  ployId: string
  killteamId: string
  ployType: string
  seq: Number
  ployName: string
  description: string

  constructor(data: {
    ployId: string
    killteamId: string
    ployType: string
    seq: Number
    title: string
    ployName: string
    description: string
  }) {
    this.ployId = data.ployId 
    this.killteamId = data.killteamId
    this.ployType = data.ployType
    this.seq = data.seq
    this.ployName = data.ployName
    this.description = data.description
  }

  toPlain(): PloyPlain {
    return {
      ployId: this.ployId,
      killteamId: this.killteamId,
      ployType: this.ployType,
      seq: this.seq,
      ployName: this.ployName,
      description: this.description
    }
  }
}
