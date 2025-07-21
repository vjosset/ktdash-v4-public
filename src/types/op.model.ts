import { Ability, AbilityPlain, OpType, OpTypePlain, Roster, RosterPlain, Weapon, WeaponPlain } from '.'
import { Option, OptionPlain } from './option.model'

export type OpPlain = {
  opId: string
  rosterId?: string
  opTypeId: string
  isOpType: boolean
  seq: number
  opName: string
  currWOUNDS: number
  isActivated: boolean
  opOrder: string
  opTypeName?: string
  keywords?: string
  wepIds: string
  optionIds: string
  hasCustomPortrait?: boolean
  updatedAt?: string
  opType?: OpTypePlain | null
  roster?: RosterPlain | null
  MOVE: string
  APL: number
  SAVE: string
  WOUNDS: number
  weapons?: WeaponPlain[] | null
  options?: OptionPlain[] | null
  abilities?: AbilityPlain[] | null
}

export class Op {
  opId: string
  rosterId?: string
  opTypeId: string
  isOpType: boolean
  seq: number
  opName: string
  currWOUNDS: number
  isActivated: boolean
  opOrder: string
  wepIds: string
  optionIds: string
  hasCustomPortrait?: boolean
  updatedAt?: string
  opType?: OpType | null
  roster?: Roster | null
  MOVE: string
  APL: number
  SAVE: string
  WOUNDS: number
  weapons?: Weapon[] | null
  options?: Option[] | null
  abilities?: Ability[] | null

  constructor(data: {
    opId: string
    rosterId?: string
    opTypeId: string
    isOpType: boolean
    seq: number
    opName: string
    currWOUNDS: number
    isActivated: boolean
    opOrder: string
    wepIds: string
    optionIds: string
    hasCustomPortrait?: boolean
    updatedAt?: string
    opType?: OpType | null
    roster?: Roster | null
    MOVE: string
    APL: number
    SAVE: string
    WOUNDS: number
    weapons?: Weapon[] | null
    options?: Option[] | null
    abilities?: Ability[] | null
  }) {
    this.opId = data.opId
    this.rosterId = data.rosterId
    this.opTypeId = data.opTypeId
    this.isOpType = false
    this.opType = data.opType ? (data.opType instanceof OpType ? data.opType : new OpType(data.opType)) : null
    this.roster = data.roster ? (data.roster instanceof Roster ? data.roster : new Roster(data.roster)) : null
    this.seq = data.seq
    this.currWOUNDS = data.currWOUNDS
    this.isActivated = data.isActivated
    this.wepIds = data.wepIds
    this.optionIds = data.optionIds
    this.opOrder = data.opOrder
    this.opName = data.opName
    this.hasCustomPortrait = data.hasCustomPortrait ?? false
    this.updatedAt = data.updatedAt
    this.MOVE = data.MOVE
    this.APL = data.APL
    this.SAVE = data.SAVE
    this.WOUNDS = data.WOUNDS
    this.weapons = data.weapons?.map(wep => 
      wep instanceof Weapon ? wep : new Weapon(wep)
    )
    this.options = data.options?.map(opt => 
      opt instanceof Option ? opt : new Option(opt)
    )
    this.abilities = data.abilities?.map(ab => 
      ab instanceof Ability ? ab : new Ability(ab)
    )
  }

  toPlain(): OpPlain {
    return {
      opId: this.opId,
      rosterId: this.rosterId,
      opTypeId: this.opTypeId,
      isOpType: false,
      seq: this.seq,
      opName: this.opName,
      currWOUNDS: this.currWOUNDS,
      isActivated: this.isActivated,
      opOrder: this.opOrder,
      wepIds: this.wepIds,
      optionIds: this.optionIds,
      hasCustomPortrait: this.hasCustomPortrait,
      updatedAt: this.updatedAt,
      opType: this.opType?.toPlain ? this.opType?.toPlain() : null,
      roster: this.roster?.toPlain ? this.roster.toPlain() : null,
      MOVE: this.MOVE,
      APL: this.APL,
      SAVE: this.SAVE,
      WOUNDS: this.WOUNDS,
      opTypeName: this.opType?.opTypeName,
      keywords: this.opType?.keywords,
      weapons: this.weapons?.map((wep) => wep.toPlain()),
      options: this.options?.map((opt) => opt.toPlain()),
      abilities: this.abilities?.map((ab) => ab.toPlain()),
    }
  }
}
