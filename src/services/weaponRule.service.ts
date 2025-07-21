// @ts-nocheck
import { WeaponRuleRepository } from '@/repositories/weaponRule.repository'
import { WeaponRule } from '@/types/weaponRule.model'

export class WeaponRuleService {
  private static repository = new WeaponRuleRepository()

  static async getWeaponRuleRow(specialId: string): Promise<WeaponRule | null> {
    const special = await this.repository.getWeaponRuleRow(specialId)
    return special ? new WeaponRule(special) : null
  }

  static async getWeaponRule(specialId: string): Promise<WeaponRule | null> {
    const special = await this.repository.getWeaponRule(specialId)
    return special ? new WeaponRule(special) : null
  }

  static async getAllWeaponRules(): Promise<WeaponRule[]> {
    const specials = await this.repository.getAllWeaponRules()
    return specials.map(special => new WeaponRule(special))
  }
}
