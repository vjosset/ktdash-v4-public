import { Equipment, EquipmentPlain, Killteam, KillteamPlain, Op, OpPlain, User, UserPlain } from '.'

/*
  Flat projection of everything a match result needs to snapshot about a roster.
  Loaded by RosterRepository.getRosterIdentityRow() so reporting a match never has
  to pull a full Roster (with ops) just to write six strings.
*/
export type RosterIdentity = {
  rosterId: string
  userId: string
  rosterName: string
  userName: string
  killteamId: string
  killteamName: string
}

export type RosterPlain = {
  rosterId: string
  userId: string
  killteamId: string
  seq: number
  rosterName: string
  description?: string
  hasCustomPortrait: boolean
  isSpotlight: boolean
  portraitUrl?: string
  viewCount: number
  importCount: number
  createdAt: Date
  updatedAt?: Date
  portraitUpdatedAt?: Date
  turn: number
  VP: number
  CP: number
  eqIds?: string
  ployIds?: string
  eloRating?: number
  ops?: OpPlain[] | null
  user?: UserPlain
  killteam?: KillteamPlain
  equipments?: EquipmentPlain[]
}

export class Roster {
  rosterId: string
  userId: string
  killteamId: string
  seq: number
  rosterName: string
  description?: string
  hasCustomPortrait: boolean
  isSpotlight: boolean
  portraitUrl?: string
  viewCount: number
  importCount: number
  createdAt: Date
  updatedAt?: Date
  portraitUpdatedAt?: Date
  turn: number
  VP: number
  CP: number
  eqIds?: string
  ployIds?: string
  eloRating?: number
  ops?: Op[] | null
  user?: User | null
  killteam?: Killteam | null
  equipments?: Equipment[]

  constructor(data: {
    rosterId: string
    userId: string
    killteamId: string
    seq: number
    rosterName: string
    description?: string
    hasCustomPortrait: boolean
    isSpotlight: boolean
    portraitUrl?: string
    viewCount: number
    importCount: number
    createdAt: Date
    updatedAt?: Date
    portraitUpdatedAt?: Date
    turn: number
    VP: number
    CP: number
    eqIds?: string
    ployIds?: string
    eloRating?: number
    ops?: Op[] | null
    user?: User | null
    killteam?: Killteam | null
    equipments?: Equipment[] | null
  }) {
    this.rosterId = data.rosterId
    this.userId = data.userId
    this.killteamId = data.killteamId
    this.seq = data.seq
    this.rosterName = data.rosterName
    this.description = data.description
    this.hasCustomPortrait = data.hasCustomPortrait
    this.isSpotlight = data.isSpotlight
    this.portraitUrl = data.portraitUrl
    this.viewCount = data.viewCount
    this.importCount = data.importCount
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.portraitUpdatedAt = data.portraitUpdatedAt
    this.turn = data.turn
    this.VP = data.VP
    this.CP = data.CP
    this.eqIds = data.eqIds
    this.ployIds = data.ployIds
    this.eloRating = data.eloRating
    this.ops = data.ops?.map(op => op instanceof Op ? op : new Op(op))
    this.user = data.user ? (data.user instanceof User ? data.user : new User(data.user)) : null
    this.killteam = data.killteam ? (data.killteam instanceof Killteam ? data.killteam : new Killteam(data.killteam)) : null
    this.equipments = data.equipments?.map(eq => eq instanceof Equipment ? eq : new Equipment(eq))
  }

  toPlain(): RosterPlain {
    return {
      rosterId: this.rosterId,
      userId: this.userId,
      killteamId: this.killteamId,
      seq: this.seq,
      rosterName: this.rosterName,
      description: this.description,
      hasCustomPortrait: this.hasCustomPortrait,
      isSpotlight: this.isSpotlight,
      portraitUrl: this.portraitUrl,
      viewCount: this.viewCount,
      importCount: this.importCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      portraitUpdatedAt: this.portraitUpdatedAt,
      turn: this.turn,
      VP: this.VP,
      CP: this.CP,
      eqIds: this.eqIds,
      ployIds: this.ployIds,
      eloRating: this.eloRating,
      ops: this.ops?.map(op => op.toPlain()),
      user: this.user?.toPlain(),
      killteam: this.killteam?.toPlain(),
      equipments: this.equipments?.map(eq => eq.toPlain()),
    }
  }
}
