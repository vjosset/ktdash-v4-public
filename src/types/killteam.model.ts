import { OpType, OpTypePlain, Roster, RosterPlain, User, UserPlain } from '.'
import { Equipment, EquipmentPlain } from './equipment.model'
import { Ploy, PloyPlain } from './ploy.model'

export type KillteamVoteInfo = {
  upvotes: number
  downvotes: number
  total: number
  ratio: number
}

export type KillteamVoteChoice = 'up' | 'down'

export type KillteamPlain = {
  factionId: string
  killteamId: string
  killteamName: string
  description: string
  composition: string
  archetypes?: string
  userId?: string
  isPublished?: boolean
  defaultRosterId?: string | null
  isHomebrew: boolean
  eloRating?: number
  user?: UserPlain | null
  defaultRoster?: RosterPlain | null
  rosterCount?: number
  opTypes: OpTypePlain[]
  ploys: PloyPlain[]
  spotlightRosters: RosterPlain[]
  equipments: EquipmentPlain[]
  voteSummary?: KillteamVoteInfo
  userVote?: KillteamVoteChoice | null
}

export class Killteam {
  factionId: string
  killteamId: string
  killteamName: string
  description: string
  composition: string
  archetypes?: string
  userId?: string
  defaultRosterId?: string | null
  isPublished?: boolean
  eloRating?: number
  user?: User | null
  defaultRoster?: Roster | null
  rosterCount: number
  opTypes: OpType[]
  ploys: Ploy[]
  spotlightRosters: Roster[]
  equipments: Equipment[]
  voteSummary?: KillteamVoteInfo
  userVote?: KillteamVoteChoice | null

  constructor(data: {
    factionId: string
    killteamId: string
    killteamName: string
    description: string
    composition: string
    archetypes?: string
    userId?: string
    defaultRosterId?: string | null
    isPublished?: boolean
    eloRating?: number
    user?: User | null
    defaultRoster?: Roster | null
    rosterCount?: number
    opTypes: OpType[]
    ploys: Ploy[]
    spotlightRosters: Roster[]
    equipments: Equipment[]
    voteSummary?: KillteamVoteInfo
    userVote?: KillteamVoteChoice | null
  }) {
    this.factionId = data.factionId
    this.killteamId = data.killteamId
    this.killteamName = data.killteamName
    this.description = data.description
    this.composition = data.composition
    this.archetypes = data.archetypes
    this.defaultRosterId = data.defaultRosterId
    this.defaultRoster = data.defaultRoster ? (data.defaultRoster instanceof Roster ? data.defaultRoster : new Roster(data.defaultRoster)) : null
    this.userId = data.userId
    this.isPublished = data.isPublished ?? true
    this.eloRating = data.eloRating
    this.user = data.user ? (data.user instanceof User ? data.user : new User(data.user)) : null
    this.opTypes = data.opTypes?.map(opType => opType instanceof OpType ? opType : new OpType(opType))
    this.ploys = data.ploys?.map(ploy => ploy instanceof Ploy ? ploy : new Ploy(ploy))
    this.spotlightRosters = data.spotlightRosters?.map(roster => roster instanceof Roster ? roster : new Roster(roster))
    this.equipments = data.equipments?.map(eq => eq instanceof Equipment ? eq : new Equipment(eq))
    const derivedCount =
      typeof (data as any)._count?.rosters === 'number'
        ? (data as any)._count.rosters
        : Array.isArray((data as any).rosters)
          ? (data as any).rosters.length
          : Array.isArray(data.spotlightRosters)
            ? data.spotlightRosters.length
            : 0
    this.rosterCount = data.rosterCount ?? derivedCount
    this.voteSummary = data.voteSummary
    this.userVote = typeof data.userVote === 'undefined' ? undefined : data.userVote
  }
  
  get isHomebrew(): boolean {
    return this.factionId === 'HBR'
  }

  toPlain(): KillteamPlain {
    const plain: KillteamPlain = {
      factionId: this.factionId,
      killteamId: this.killteamId,
      killteamName: this.killteamName,
      description: this.description,
      composition: this.composition,
      archetypes: this.archetypes,
      defaultRosterId: this.defaultRosterId,
      defaultRoster: this.defaultRoster?.toPlain() ?? null,
      userId: this.userId,
      isPublished: this.isPublished,
      eloRating: this.eloRating,
      user: this.user?.toPlain(),
      isHomebrew: this.isHomebrew,
      rosterCount: this.rosterCount,
      opTypes: this.opTypes?.map((opType) => opType.toPlain()),
      ploys: this.ploys?.map((ploy) => ploy.toPlain()),
      spotlightRosters: this.spotlightRosters?.map((roster) => roster.toPlain()),
      equipments: this.equipments?.map((eq) => eq.toPlain()),
    }
    if (typeof this.voteSummary !== 'undefined') {
      plain.voteSummary = this.voteSummary
    }
    if (typeof this.userVote !== 'undefined') {
      plain.userVote = this.userVote
    }
    return plain
  }
}
