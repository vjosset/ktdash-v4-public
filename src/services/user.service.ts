// @ts-nocheck
import { UserRepository } from '@/src/repositories/user.repository'
import { User } from '@/types'

export class UserService {
  private static repository = new UserRepository()

  static async getUserRow(userId: string): Promise<User | null> {
    const user = await this.repository.getUserRow(userId)
    if (!user) return null
    return new User(user)
  }

  static async getUser(userId: string): Promise<User | null> {
    const user = await this.repository.getUser(userId)
    return user ? new User(user) : null
  }

  static async getAllUsers(): Promise<User[]> {
    const users = await this.repository.getAllUsers()
    return users.map(user => new User(user))
  }

  static async getUserByUsername(userName: string): Promise<User | null> {
    const user = await this.repository.getUserByUsername(userName)
    return user ? new User(user) : null
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    await this.repository.updateUser(userId, data)
    return await this.getUser(userId)
  }

  static async fixRosterSeqs(userId: string): Promise<null> {
    // Reorder/re-seq the user's rosters
    await this.repository.fixRosterSeqs(userId)
  }
}
