//@ts-nocheck
import { genId } from '@/lib/utils/utils'
import { RosterRepository } from '@/src/repositories/roster.repository'
import { Equipment, Option, Roster, Weapon } from '@/types'
import fs from 'fs/promises'
import path from 'path'
import { OpService } from './op.service'
import { UserService } from './user.service'

export class RosterService {
  private static repository = new RosterRepository()

  static async getRosterRow(rosterId: string): Promise<Roster | null> {
    const row = await this.repository.getRosterRow(rosterId)
    return row ? new Roster(row) : null
  }

  static async getRoster(rosterId: string): Promise<Roster | null> {
    const row = await this.repository.getRoster(rosterId)
    if (!row) return null
    const roster = row ? new Roster(row) : null

    // Hard-coded list of OpTypeIDs that aren't affected by Equipment
    //  E.g. Grots and Squigs for Kommandos, Bomb Squig for Wrecka Krew
    const opTypesNoEq = [
      'ORK-KOM-GROT',
      'ORK-KOM-SQUIG',
      'ORK-WK-SQUIG'
    ]
    const isNemesisOp = (op) => op.opTypeId.startsWith('SPEC-NEM-')

    // Get the selected equipments for this roster
    roster.equipments = []
    roster?.killteam?.equipments.map((eq, idx) => {
      // Check if this equipment ID is in the current roster's eqIds
      if (roster.eqIds?.includes(eq.eqId)) {
        // This equipment is selected, push a deep-copy clone into the roster's equipments
        roster.equipments.push(new Equipment(structuredClone(eq)))

        const effectTokens = (eq.effects ?? '')
          .split('^')
          .map((token) => token.trim())
          .filter((token) => token.length > 0)

        // Extract optype filter (if any) and remove it from effects
        // Sample effects string with optype filter:
        //    optype:CHAOS-WC-GNR,CHAOS-WC-IB,CHAOS-WC-WAR^weptype:M|A:+1
        //    Daemonmaw weapons equipment for WarpCoven only applies to Rubric Marine operatives and give +1 ATK on their Melee weapons
        const optypeToken = effectTokens.find((token) => token.startsWith('optype:'))
        const optypeIds = (optypeToken ?? '')
          .split(':')[1]
          ?.split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0) ?? []

        const filteredEffectTokens = effectTokens.filter((token) => !token.startsWith('optype:'))

        const weaponEffects = filteredEffectTokens.filter((token) => token.startsWith('ADDWEP'))
        const nonWeaponEffects = filteredEffectTokens.filter((token) => !token.startsWith('ADDWEP'))

        // If this equipment has a non-weapon effect, add it to the operative's options
        // UNLESS it's a "No equipment" operative type
        if (nonWeaponEffects.length > 0) {
          const option = new Option ({
            optionId: eq.eqId,
            optionName: 'Eq: ' + eq.eqName,
            description: eq.description,
            effects: nonWeaponEffects.join('^')
          })
          roster?.ops?.map((op) => !opTypesNoEq.includes(op.opTypeId) && !isNemesisOp(op) && (op.options = op.options ?? []))
          roster?.ops?.map((op) => {
            if (opTypesNoEq.includes(op.opTypeId) || isNemesisOp(op)) return
            if (optypeIds.length > 0 && !optypeIds.includes(op.opTypeId)) return
            op.options?.push(option)
          })
        }

        // If this equipment grants weapons, add each one to all applicable operatives in this roster
        weaponEffects.forEach((weaponEffect, weaponIdx) => {
          // Example: ADDWEP:Combat Blade|M|5|3+|3/4|Rending
          const [, weaponData = ''] = weaponEffect.split(':', 2)
          if (!weaponData) return
          const wepstats = weaponData.split('|')
          const wepIdSuffix = weaponIdx === 0 ? '-EQ' : `-EQ-${weaponIdx}`
          const weaponProfileId = `${eq.eqId}${wepIdSuffix}-0`
          const wep: Weapon = new Weapon( {
            wepId: eq.eqId + wepIdSuffix, // Append "-EQ" so that options and equipments that modify specific weapon IDs don't have collisions (e.g. BG - Boltgun vs Blight Grenade)
            wepName: 'Eq: ' + (wepstats[0] ?? ''),
            wepType: wepstats[1],
            seq: 1000, // Always last
            profiles: [
              {
                profileId: weaponProfileId,
                ATK: wepstats[2],
                HIT: wepstats[3],
                DMG: wepstats[4],
                WR: wepstats[5]
              }
            ]
          })

          roster?.ops?.map((op) => {
            if (opTypesNoEq.includes(op.opTypeId) || isNemesisOp(op)) return
            if (optypeIds.length > 0 && !optypeIds.includes(op.opTypeId)) return
            op.weapons = op.weapons ?? []
            // Deep-copy the weapon for each operative
            op.weapons.push(new Weapon(structuredClone(wep)))
          })
        })
      }
    })

    // Fill the ops with their OpType's stats
    roster?.ops.map((op) => OpService.buildOpStats(op))

    return roster
  }

  static async getRandomSpotlight(): Promise<Roster | null> {
    const rosterId = await this.repository.getRandomSpotlightRosterId()
    if (!rosterId) return null
    return await this.getRoster(rosterId)
  }

  static async createRoster(data: Partial<Roster>): Promise<Roster | null> {
    data.rosterId = genId()

    // Always make the new roster the first one in the user's list
    data.seq = -1
    const raw = await this.repository.createRoster(data)
    if (!raw) throw new Error('Failed to create roster')
  
    // Reorder/re-seq the user's rosters
    await UserService.fixRosterSeqs(data.userId)

    // Done -  Return latest version of the new roster
    return await this.getRoster(data.rosterId)
  }

  static async updateRoster(rosterId: string, data: Partial<Roster>): Promise<Roster | null> {
    // Get original roster's state
    const originalRoster = await this.getRosterRow(rosterId)

    // Reset op activation if this is the next Turn
    const resetRosterActivation = !!data.turn && data.turn > originalRoster.turn
    if (resetRosterActivation) {
      // Next turn - Reset op activation and roster TOs
      await this.resetRosterActivation(rosterId)
    }

    // Apply updates
    const raw = await this.repository.updateRoster(rosterId, data)
    if (!raw) throw new Error('Failed to update roster')

    // Get the new roster
    return await this.getRoster(rosterId)
  }

  static async deleteRoster(rosterId: string): Promise<void> {
    const roster = await this.getRosterRow(rosterId)

    // Delete all images/portraits for this roster
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const dirName = path.join(uploadDir, `user_${roster.userId}`, `roster_${rosterId}`)
    try {
      await fs.rm(dirName, { recursive: true, force: true })
    }
    catch {
      // Something went wrong - Just log it and move on
      console.error('Could not delete portraits for roster', rosterId)
    }

    await this.repository.deleteRoster(rosterId)
    await UserService.fixRosterSeqs(roster.userId)
  }

  static async resetRosterActivation(rosterId: string): Promise<Roster | null> {
    await this.repository.resetRosterActivation(rosterId)
    return await this.getRoster(rosterId)
  }

  static async updateRosterTurn(rosterId: string, turn: number): Promise<Roster | null> {
    const roster = await this.getRoster(rosterId)
    if (!roster) throw new Error('Roster not found')

    const resetRosterActivation = turn > roster.turn
    if (resetRosterActivation) {
      // Next turn - Reset op activation
      await this.resetRosterActivation(rosterId)
    }

    return await this.getRoster(rosterId)
  }

  static async resetRoster(rosterId: string): Promise<Roster | null> {
    const roster = await this.getRoster(rosterId)
    if (!roster) throw new Error('Roster not found')

    // Reset roster trackers
    await this.repository.updateRoster(rosterId, {
      turn: 1,
      VP: 0,
      CP: 3,
      ployIds: ''
    })

    // Reset all ops' activation and currWOUNDS
    await Promise.all(roster.ops.map(async op => {
      // Op's wounds should already be updated if needed in getRoster which calls buildOpStats to apply mods
      const newCurrWOUNDS = op.WOUNDS
      await OpService.updateOp(op.opId, { currWOUNDS: newCurrWOUNDS, isActivated: false})
    }))

    // Return the update roster
    return await this.getRoster(rosterId)
  }

  static async cloneRoster(sourceRosterId: string, destUserId: string, destRosterName: string): Promise<Roster | null> {
    // Get Roster to clone
    const sourceRosterRow = await RosterService.getRosterRow(sourceRosterId)
    if (!sourceRosterRow) return null
    
    // Get the full roster
    const sourceRoster = await RosterService.getRoster(sourceRosterId)
    if (!sourceRoster) return null
    
    // Prepare a deep-copy clone of the roster
    const newRoster = JSON.parse(JSON.stringify(sourceRoster))

    // Update its fields
    newRoster.userId = destUserId
    newRoster.name = destRosterName

    // Prepare the ops
    for(const op of newRoster.ops) {
      op.rosterId = newRoster.rosterId
      op.opId = genId()
    }

    const newRosterRow = {
      userId: destUserId,
      killteamId: newRoster.killteamId,
      seq: -1,
      rosterName: newRoster.name,
      turn: 1,
      VP: 0,
      CP: 3,
      eqIds: '',
      ployIds: '',
      viewCount: 0,
      importCount: 0,
      isSpotlight: false,
      hasCustomPortrait: false,
    }

    if (sourceRoster.userId != destUserId) {
      // Imported from another user - Increment import count
      this.incrementRosterImportCount(sourceRosterId)
    } else {
      // Self-clone - Set a name for the roster
      newRosterRow.rosterName + ' - Copy'
    }

    // Now create the roster and its ops
    const createdRoster = await RosterService.createRoster(newRosterRow)
    if (!createdRoster) {
      return null
    }
    
    // Create all the ops
    for(const op of newRoster.ops) {
      const opRow = {
        opId: op.opId,
        rosterId: createdRoster.rosterId,
        opName: op.opName,
        opTypeId: op.opTypeId,
        seq: op.seq,
        wepIds: op.wepIds,
        optionIds: op.optionIds,
        currWOUNDS: op.WOUNDS,
        isActivated: false,
        opOrder: op.opOrder,
        hasCustomPortrait: false,
      }
      await OpService.createOp(opRow)
    }

    // Get the finalized roster with all its stuff
    const finalRoster = await RosterService.getRoster(createdRoster.rosterId)

    if (!finalRoster) return null

    // Done
    return finalRoster
  }
  
  static async deleteRosterPortrait(rosterId: string): Promise<Roster | null> {
    const roster = await this.getRosterRow(rosterId)
    if (!roster) throw new Error('Roster not found')

    // Update DB first (don't wait for file system to succeed)
    const updatedRoster = await this.updateRoster(rosterId, { hasCustomPortrait: false, portraitUpdatedAt: new Date() })

    try {
      const uploadDir = process.env.UPLOADS_DIR!
      const filePath = path.resolve(
        uploadDir,
        `user_${roster.userId}`,
        `roster_${roster.rosterId}`,
        `roster_${roster.rosterId}.jpg`
      )

      await fs.unlink(filePath)
    } catch (ex) {
      // Log but don't block flow
      console.warn(`Could not delete portrait file for roster ${rosterId}:`, ex)
    }

    return updatedRoster
  }

  static async incrementRosterViewCount(rosterId) {
    await this.repository.incrementRosterViewCount(rosterId)
  }

  static async incrementRosterImportCount(rosterId) {
    await this.repository.incrementRosterImportCount(rosterId)
  }
}
