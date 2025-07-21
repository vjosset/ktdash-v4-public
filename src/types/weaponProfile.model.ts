export type WeaponProfilePlain = {
  wepprofileId: string
  wepId: string
  seq: number
  profileName: string
  ATK: string
  HIT: string
  DMG: string
  WR: string
}

export class WeaponProfile {
  wepprofileId: string
  wepId: string
  seq: number
  profileName: string
  ATK: string
  HIT: string
  DMG: string
  WR: string

  constructor(data: {
    wepprofileId: string
    wepId: string
    seq: number
    profileName: string
    ATK: string
    HIT: string
    DMG: string
    WR: string
  }) {
    this.wepprofileId = data.wepprofileId
    this.wepId = data.wepId
    this.seq = data.seq
    this.profileName = data.profileName
    this.ATK = data.ATK
    this.HIT = data.HIT
    this.DMG = data.DMG
    this.WR = data.WR
  }

  toPlain(): WeaponProfilePlain {
    return {
      wepprofileId: this.wepprofileId,
      wepId: this.wepId,
      seq: this.seq,
      profileName: this.profileName,
      ATK: this.ATK,
      HIT: this.HIT,
      DMG: this.DMG,
      WR: this.WR
    }
  }
}
