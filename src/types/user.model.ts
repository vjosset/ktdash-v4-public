import { Roster, RosterPlain } from '.'

export type UserPlain = {
  userId: string
  email?: string | null
  userName?: string | null
  rosters?: RosterPlain[] | null
}

export class User {
  userId: string
  email?: string | null
  userName: string
  rosters?: Roster[] | null

  constructor(data: {
    userId: string
    email: string | null
    userName: string
    rosters?: Roster[] | null
  }) {
    this.userId = data.userId
    this.email = data.email
    this.userName = data.userName
    this.rosters = data.rosters ?? [] // Provide default empty array
  }

  toPlain(): UserPlain {
    return {
      userId: this.userId,
      email: this.email,
      userName: this.userName,
      rosters: this.rosters?.map((roster) => roster.toPlain()),
    }
  }
}
