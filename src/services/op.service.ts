// @ts-nocheck
import { genId } from '@/lib/utils/utils'
import { OpRepository } from '@/src/repositories/op.repository'
import { Ability, Op, Option, Weapon } from '@/types'
import fs from 'fs/promises'
import path from 'path'
import { RosterService } from './roster.service'

export class OpService {
  private static repository = new OpRepository()

  static async getOpRow(opId: string): Promise<Op | null> {
    const op = await this.repository.getOpRow(opId)
    return op ? new Op(op) : null
  }

  static async getOp(opId: string): Promise<Op | null> {
    const raw = await this.repository.getOp(opId)
    if (!raw) return null

    const op = raw ? new Op(raw) : null

    this.buildOpStats(op)

    return op
  }

  static isInjurableMOVE(op: Op): boolean {
    const nonInjurableOptionIds = [ // Equipment IDs
      'CHAOS-FELL-WP',
      'CHAOS-PM-PB',
      'IMP-INB-CS',
      'IMP-NOV-HE',
      'IMP-TEMPAQ-CS',
    ]
    if (op.options?.some((opt) => nonInjurableOptionIds.includes(opt.optionId))) return false

    const nonInjurableAbilityIds =[ // Ability IDs
      'IMP-INQ-INQ24-PEN-A-CM'
    ]
    if (op.abilities?.some((ab) => nonInjurableAbilityIds.includes(ab.abilityId))) return false

    // Default to true
    return true
  }
  
  static isInjurableWEPS(op: Op): boolean {
    const nonInjurableOptionIds = [ // Equipment IDs
      'CHAOS-PM-PB',
    ]
    if (op.options?.some((opt) => nonInjurableOptionIds.includes(opt.optionId))) return false
    
    const nonInjurableAbilityIds =[ // Ability IDs
      'IMP-INQ-INQ24-PEN-A-CM'
    ]
    if (op.abilities?.some((ab) => nonInjurableAbilityIds.includes(ab.abilityId))) return false

    return true
  }

  static buildOpStats(op: Op) {
    op.MOVE = op.opType?.MOVE
    op.APL = op.opType?.APL
    op.SAVE = op.opType?.SAVE
    op.WOUNDS = op.opType?.WOUNDS

    this.buildOpGear(op)

    const isInjured = op.currWOUNDS < (op.WOUNDS / 2)

    if (this.isInjurableMOVE(op) && isInjured) {
      // Reduce this operative's MOVE by 2" but never below 4"
      const numericMove = Number((op.MOVE ?? '').replace('"', '')) || 0
      const reducedMove = Math.max(numericMove - 2, 4)
      op.MOVE = `${reducedMove}"`
    }
    
    if (this.isInjurableWEPS(op) && isInjured) {
      // Worsen this operative's weapons' HIT by 1
      op.weapons?.map((wep) => {
        wep.profiles?.map((pro) => {
          //Special case for Deathwatch Blademaster where its Xenophase Blade does not get modified by being injured
          if (op.opTypeId === 'IMP-DW-BLM' && wep.wepName === 'Xenophase Blade') {
            return
          }
          pro.HIT = (Number(pro.HIT.replace('+', '')) + 1) + '+'
        })
      })
    }
  }

  static buildOpGear(op: Op) {
    // Loop through the weapons, options, and abilities to find the ones selected by this operative
    op.weapons = op.weapons ?? []
    op.opType.weapons?.map((wep) => {
      if ((',' + op.wepIds + ',').includes(',' + wep.wepId + ',')) {
        // This is one of this op's selected weapons
        op.weapons.push(new Weapon(structuredClone(wep)))
      }
    })

    op.weapons = op.weapons.sort((a, b) => a.seq - b.seq)
    
    op.options = op.options ?? []
    op.opType.options?.map((opt) => {
      if ((',' + op.optionIds + ',').includes(',' + opt.optionId + ',')) {
        // This is one of this op's selected options
        const nextOpt = new Option(structuredClone(opt))
        const effectTokens = (nextOpt.effects ?? '')
          .split('^')
          .map((token) => token.trim())
          .filter((token) => token.length > 0)

        const optypeToken = effectTokens.find((token) => token.startsWith('optype:'))
        const optypeIds = (optypeToken ?? '')
          .split(':')[1]
          ?.split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0) ?? []

        if (optypeIds.length > 0 && !optypeIds.includes(op.opTypeId)) {
          return
        }

        // Strip optype tokens before applying effects
        const filteredEffectTokens = effectTokens.filter((token) => !token.startsWith('optype:'))
        nextOpt.effects = filteredEffectTokens.join('^')

        op.options.push(nextOpt)
      }
    })

    op.abilities = op.opType.abilities.map((ability) => new Ability(structuredClone(ability)))

    // Now loop through the options and apply the effects
    op.options.map((opt) => {
      if (!opt.effects || opt.effects == '|' || opt.effects == '') return

      const effectTokens = opt.effects
        .split('^')
        .map((token) => token.trim())
        .filter((token) => token.length > 0)

      effectTokens.forEach((effectToken) => {
        const effects = effectToken
          .split('|')
          .map((segment) => segment.trim())
          .filter((segment, idx, arr) => segment.length > 0 || arr.length === 1)

        if (!effects.length) return

        if (effects[0].indexOf('wep') == 0) {
          /*
            Weapon Mod

            [filterType]:[filterValue]|[field]:[value]

            wepid:DB|SR:2" Dev2
            wepid:FB,FS,FSTRM,MB|SR:Dev1
            weptype:M|D:1/0
          */

          // Filter type
          const filterType = effects[0].indexOf('wepid') == 0 ? 'wepid' : 'weptype'
          const filterValue = effects[0].split(':')[1]?.trim()
          if (!filterValue) return

          const affectedField = effects[1]?.split(':')[0].trim()
          const fieldMod = effects[1]?.split(':')[1]?.trim()
          if (!affectedField || fieldMod === undefined) return

          const affectedWeapons: Weapon[] = []

          // This is a weapon mod, let's find out its filter/criteria
          if (filterType == 'wepid') {
            // This effect applies to specific weapon IDs
            const filterIds = filterValue.split(',').map((id) => id.trim())

            affectedWeapons.push(
              ...op.weapons.filter((w) =>
                filterIds.some((id) => id.length > 0 && w.wepId.endsWith(id))
              )
            )
          } else {
            // This effect applies to all weapons of a specific type
            affectedWeapons.push(...op.weapons.filter((w) => w.wepType === filterValue))
          }

          // Now apply the effect to the affected field on the affected weapons
          affectedWeapons.forEach((weapon) => {
            weapon.profiles.forEach((profile) => {
              switch (affectedField) {
              case 'WR':
              case 'SR':
                profile.WR = profile.WR + (profile.WR ? ', ' : '') + fieldMod
                break
              case 'D':
              case 'DMG':
                // DMG has two numbers! [Normal]/[Critical]
                const origNDMG = profile.DMG.split('/')[0]
                const origCDMG = profile.DMG.split('/')[1]
                const modNDMG = fieldMod.split('/')[0]
                const modCDMG = fieldMod.split('/')[1]

                profile.DMG = `${(Number(origNDMG) || 0) + Number(modNDMG)}/${(Number(origCDMG) || 0) + Number(modCDMG)}`
                break
              case 'A':
              case 'ATK':
                profile.ATK = (Number(profile.ATK) || 0) + Number(fieldMod)
                break
              }
            })
          })
        } else {
          // This is an Operative mod, apply it to the Op
          const field = effects[0]
          const value = effects[1]
          if (value === undefined) return

          switch (field) {
          case 'M':
            // Move is in inches, so we need to remove the " and convert to number
            op.MOVE = (Number(op.MOVE.replace('"', '') || 0) + Number(value)) + '"'
            break
          case 'SV':
            op.SAVE = (Number(op.SAVE.replace('+', '') || 0) + Number(value)) + '+'
            break
          case 'W':
            op.WOUNDS = Number(op.WOUNDS || 0) + Number(value)
            break
          }
        }
      })
    })
  }

  static async createOp(data: Partial<Op>): Promise<Op | null> {
    data.opId = genId()
    const raw = await this.repository.createOp(data)
    if (!raw) throw new Error('Failed to create op')
    return await this.getOp(data.opId)
  }

  static async updateOp(opId: string, data: Partial<Op>): Promise<Op | null> {
    await this.repository.updateOp(opId, data)
    return await this.getOp(opId)
  }

  static async deleteOp(opId: string): Promise<void> {
    // Delete the op's portrait
    await this.deleteOpPortrait(opId)

    // Delete the op from the DB
    await this.repository.deleteOp(opId)
  }
  
  static async deleteOpPortrait(opId: string): Promise<void> {
    const op = await this.getOpRow(opId)
    if (!op?.hasCustomPortrait) return

    const roster = await RosterService.getRosterRow(op.rosterId)
    if (!roster) throw new Error('Roster not found')

    // Update DB first (don't wait for file system to succeed)
    await this.updateOp(opId, { hasCustomPortrait: false, portraitUpdatedAt: new Date() })

    try {
      const uploadDir = process.env.UPLOADS_DIR!
      const filePath = path.resolve(
        uploadDir,
        `user_${roster.userId}`,
        `roster_${op.rosterId}`,
        `op_${opId}.jpg`
      )

      await fs.unlink(filePath)
    } catch (ex) {
      // Log but don't block flow
      console.warn(`Could not delete portrait file for op ${opId}:`, ex)
    }
  }

  static async fixOpSeqs(rosterId: string): Promise<void> {
    if (!rosterId) throw new Error('Missing rosterId')
    const roster = await RosterService.getRoster(rosterId)

    if (!roster || !roster.ops) return

    // Reindex seq densely as 1..N in current seq order
    await Promise.all(
      roster.ops.map((op, idx) =>
        this.repository.updateOp(op.opId, { seq: idx + 1 })
      )
    )
  }
}
