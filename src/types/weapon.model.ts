import { WeaponProfile, WeaponProfilePlain } from '.'

export type WeaponPlain = {
  wepId: string
  opTypeId: string
  seq: number
  wepName: string
  wepType: string
  isDefault: boolean
  profiles?: WeaponProfilePlain[]
}

export class Weapon {
  wepId: string
  opTypeId: string
  seq: number
  wepName: string
  wepType: string
  isDefault: boolean
  profiles?: WeaponProfile[]

  constructor(data: {
    wepId: string
    opTypeId: string
    seq: number
    wepName: string
    wepType: string
    isDefault: boolean
    profiles?: WeaponProfile[]
  }) {
    this.wepId = data.wepId
    this.opTypeId = data.opTypeId
    this.seq = data.seq
    this.wepName = data.wepName
    this.wepType = data.wepType
    this.isDefault = data.isDefault
    this.profiles = data.profiles?.map(profile =>
      profile instanceof WeaponProfile ? profile : new WeaponProfile(profile)
    )
  }

  toPlain(): WeaponPlain {
    return {
      wepId: this.wepId,
      opTypeId: this.opTypeId,
      seq: this.seq,
      wepName: this.wepName,
      wepType: this.wepType,
      isDefault: this.isDefault,
      profiles: this.profiles?.map(profile => profile.toPlain())
    }
  }
}
