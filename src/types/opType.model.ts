import { Weapon, WeaponPlain } from '.'
import { Ability, AbilityPlain } from './ability.model'
import { Option, OptionPlain } from './option.model'

export type OpTypePlain = {
  opTypeId: string
  killteamId: string
  seq: number
  opTypeName: string
  MOVE: string
  APL: number
  SAVE: string
  WOUNDS: number
  keywords: string
  basesize: number
  nameType: string
  isOpType: true
  opName?: string
  opType: null
  opId?: string | null
  currWOUNDS?: number
  isActivated?: boolean
  order?: string
  weapons?: WeaponPlain[]
  abilities?: AbilityPlain[]
  options?: OptionPlain[]
}

export class OpType {
  opTypeId: string
  killteamId: string
  seq: number
  opTypeName: string
  MOVE: string
  APL: number
  SAVE: string
  WOUNDS: number
  keywords: string
  basesize: number
  nameType: string
  isOpType: true
  weapons?: Weapon[]
  abilities?: Ability[]
  options?: Option[]

  constructor(data: {
    opTypeId: string
    killteamId: string
    seq: number
    opTypeName: string
    MOVE: string
    APL: number
    SAVE: string
    WOUNDS: number
    keywords: string
    basesize: number
    nameType: string
    weapons?: Weapon[]
    abilities?: Ability[]
    options?: Option[]
  }) {
    this.opTypeId = data.opTypeId
    this.killteamId = data.killteamId
    this.seq = data.seq
    this.opTypeName = data.opTypeName
    this.MOVE = data.MOVE
    this.APL = data.APL
    this.SAVE = data.SAVE
    this.WOUNDS = data.WOUNDS
    this.keywords = data.keywords
    this.basesize = data.basesize
    this.nameType = data.nameType || ''
    this.isOpType = true
    this.weapons = data.weapons?.map(weapon => 
      weapon instanceof Weapon ? weapon : new Weapon(weapon)
    )
    this.abilities = data.abilities?.map(ability => 
      ability instanceof Ability ? ability : new Ability(ability)
    )
    this.options = data.options?.map(opt => 
      opt instanceof Option ? opt : new Option(opt)
    )
  }

  toPlain(): OpTypePlain {
    return {
      opTypeId: this.opTypeId,
      killteamId: this.killteamId,
      seq: this.seq,
      opTypeName: this.opTypeName,
      MOVE: this.MOVE,
      APL: this.APL,
      SAVE: this.SAVE,
      WOUNDS: this.WOUNDS,
      keywords: this.keywords,
      basesize: this.basesize,
      nameType: this.nameType,
      isOpType: true,
      weapons: this.weapons?.map((weapon) => weapon.toPlain()),
      abilities: this.abilities?.map((ability) => ability.toPlain()),
      options: this.options?.map((opt) => opt.toPlain()),
      // Helper fields to map to Unit
      isActivated: false,
      currWOUNDS: this.WOUNDS,
      opName: this.opTypeName,
      opType: null,
      opId: null
    }
  }
}
