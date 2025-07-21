//@ts-nocheck
import { genId } from '@/lib/utils/utils'
import { RosterRepository } from '@/src/repositories/roster.repository'
import { Equipment, Option, Roster, Weapon } from '@/types'
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

    // Get the selected equipments for this roster
    roster.equipments = [];
    roster?.killteam?.equipments.map((eq, idx) => {
      // Check if this equipment ID is in the current roster's eqIds
      if (roster.eqIds?.includes(eq.eqId)) {
        // This equipment is selected, push a deep-copy clone into the roster's equipments
        roster.equipments.push(new Equipment(structuredClone(eq)))

        // If this weapon has an effect (other than weapon, handled below), add it to the operative's options
        if (eq.effects != '' && eq.effects?.indexOf("ADDWEP") != 0) {
          const option = new Option ({
            optionId: eq.eqId,
            optionName: 'Eq: ' + eq.eqName,
            description: eq.description,
            effects: eq.effects
          });
          roster?.ops?.map((op) => op.options = op.options ?? [])
          roster?.ops?.map((op) => op.options?.push(option))
        }

        // If this equipment is a weapon, add it to all operatives in this roster
        console.log("Checking equipment", eq.eqId, "- Effects:", eq.effects)
        if (eq.effects?.indexOf("ADDWEP") == 0) {
          // Example: ADDWEP:Combat Blade|M|5|3+|3/4|Rending
          const wepstats = eq.effects.split(":")[1].split('|');
          const wep: Weapon = new Weapon( {
            wepId: eq.eqId,
            wepName: 'Eq: ' + wepstats[0],
            wepType: wepstats[1],
            seq: 1000, // Always last
            profiles: [
              {
                profileId: eq.eqId + '-0',
                ATK: wepstats[2],
                HIT: wepstats[3],
                DMG: wepstats[4],
                WR: wepstats[5]
              }
            ]
          })

          console.log("Adding eq weapon", eq.eqName, "to operatives")
          roster?.ops?.map((op) => op.weapons = op.weapons ?? [])
          roster?.ops?.map((op) => op.weapons?.push(wep))
        }
      }
    })

    // Fill the ops with their OpType's stats
    roster?.ops.map((op) => OpService.buildOpStats(op))

    return roster
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
      CP: 3
    })

    // Reset all ops' activation and currWOUNDS
    await Promise.all(roster.ops.map(async op => {
      // Op's wounds should already be updated if needed in getRoster which calls buildOpStats to apply mods
      const newCurrWOUNDS = Number(op.WOUNDS)
      await OpService.updateOp(op.opId, { currWOUNDS: newCurrWOUNDS, isActivated: false})
    }))

    // Return the update roster
    return await this.getRoster(rosterId)
  }

  static async cloneRoster(sourceRosterId: string, destUserId: string, destRosterName: string): Promise<Roster | null> {
    // Get Roster to clone
    const rosterRow = await RosterService.getRosterRow(sourceRosterId)
    if (!rosterRow) return null
    
    // Get the full roster
    const roster = await RosterService.getRoster(sourceRosterId)
    if (!roster) return null
    
    // Prepare a deep-copy clone of the roster
    const newRoster = JSON.parse(JSON.stringify(roster))

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
      hasCustomPortrait: false,
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
}
