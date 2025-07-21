import type { WeaponRule } from '@prisma/client'
import { BaseRepository } from './base.repository'

export class WeaponRuleRepository extends BaseRepository {
  async getWeaponRuleRow(code: string): Promise<WeaponRule | null> {
    return this.prisma.weaponRule.findUnique({
      where: { code }
    })
  }

  async getWeaponRule(code: string) {
    return this.prisma.weaponRule.findUnique({
      where: { code }
    })
  }

  async getAllWeaponRules() {
    const rules = await this.prisma.weaponRule.findMany()
    return rules.sort((a, b) => (b.code?.length || 0) - (a.code?.length || 0))
  }
}
