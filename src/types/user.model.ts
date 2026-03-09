import { Killteam, KillteamPlain, Roster, RosterPlain } from '.'

export type UserPlain = {
  userId: string
  email?: string | null
  userName?: string | null
  eloRating?: number
  rosters?: RosterPlain[] | null
  killteams?: KillteamPlain[] | null
}

export class User {
  userId: string
  email?: string | null
  userName: string
  eloRating?: number
  rosters?: Roster[] | null
  killteams?: Killteam[] | null

  constructor(data: {
    userId: string
    email: string | null
    userName: string
    eloRating?: number
    rosters?: Roster[] | null
    killteams?: Killteam[] | null
  }) {
    this.userId = data.userId
    this.email = data.email
    this.userName = data.userName
    this.eloRating = data.eloRating
    this.rosters = data.rosters?.map(roster => roster instanceof Roster ? roster : new Roster(roster))
    this.killteams = data.killteams?.map(killteam => killteam instanceof Killteam ? killteam : new Killteam(killteam))
  }

  toPlain(): UserPlain {
    return {
      userId: this.userId,
      email: this.email,
      userName: this.userName,
      eloRating: this.eloRating,
      rosters: this.rosters?.map((roster) => roster.toPlain()),
      killteams: this.killteams?.map((killteam) => killteam.toPlain()),
    }
  }
}
