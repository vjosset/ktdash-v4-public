// @ts-nocheck
import { genId } from '@/lib/utils/utils'
import { OpRepository } from '@/src/repositories/op.repository'
import { Ability, Op, Option, Weapon } from '@/types'

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

    this.buildOpStats(op);

    return op
  }

  static buildOpStats(op: Op) {
    op.MOVE = op.opType?.MOVE;
    op.APL = op.opType?.APL;
    op.SAVE = op.opType?.SAVE;
    op.WOUNDS = op.opType?.WOUNDS;

    this.buildOpGear(op);
  }

  static buildOpGear(op: Op) {
    // Loop through the weapons, options, and abilities to find the ones selected by this operative
    op.weapons = op.weapons ?? [];
    op.opType.weapons?.map((wep) => {
      if ((',' + op.wepIds + ',').includes(',' + wep.wepId + ',')) {
        // This is one of this op's selected weapons
        op.weapons.push(new Weapon(structuredClone(wep)));
      }
    })

    op.weapons = op.weapons.sort((a, b) => a.seq - b.seq)
    
    op.options = op.options ?? [];
    op.opType.options?.map((opt) => {
      if ((',' + op.optionIds + ',').includes(',' + opt.optionId + ',')) {
        // This is one of this op's selected options
        op.options.push(new Option(structuredClone(opt)));
      }
    })

    op.abilities = op.opType.abilities.map((ability) => new Ability(structuredClone(ability)));

    // Now loop through the options and apply the effects
    op.options.map((opt) => {
      if (!opt.effects || opt.effects == '|' || opt.effects == '') return;

      const effects = opt.effects.split('|');

      if (effects[0].indexOf('wep') == 0) {
        /*
          Weapon Mod

          [filterType]:[filterValue]|[field]:[value]

          wepid:DB|SR:2" Dev2
          wepid:FB,FS,FSTRM,MB|SR:Dev1
          weptype:M|D:1/0
        */

        // Filter type
        const filterType = effects[0].indexOf('wepid') == 0 ? 'wepid' : 'weptype';
        const filterValue = effects[0].split(':')[1].trim();

        const affectedField = effects[1].split(':')[0].trim();
        const fieldMod = effects[1].split(':')[1].trim();

        const affectedWeapons: Weapon[] = [];

        // This is a weapon mod, let's find out its filter/criteria
        if (filterType == 'wepid') {
          // This effect applies to specific weapon IDs
          const filterIds = filterValue.split(',');

          affectedWeapons.push(
            ...op.weapons.filter((w) =>
              filterIds.some((id) => w.wepId.endsWith(id))
            )
          );
        } else {
          // This effect applies to all weapons of a specific type
          affectedWeapons.push(...op.weapons.filter((w) => w.wepType === filterValue));
        }

        // Now apply the effect to the affected field on the affected weapons
        affectedWeapons.forEach((weapon) => {
          weapon.profiles.forEach((profile) => {
            switch (affectedField) {
              case 'WR':
              case 'SR':
                profile.WR = profile.WR + (profile.WR ? ', ' : '') + fieldMod;
                break;
              case 'D':
              case 'DMG':
                profile.DMG = (Number(profile.DMG) || 0) + Number(fieldMod);
                break;
              case 'A':
              case 'ATK':
                profile.ATK = (Number(profile.ATK) || 0) + Number(fieldMod);
                break;
            }
          })
        });
      } else {
        // This is an Operative mod, apply it to the Op
        const field = effects[0];
        const value = effects[1];

        switch (field) {
          case 'M':
            // Move is in inches, so we need to remove the " and convert to number
            op.MOVE = (Number((op.MOVE.replace('"', '') || 0)) + Number(value)) + '"';
            break;
          case 'SV':
            op.SAVE = (op.SAVE || 0) + Number(value);
            break;
          case 'W':
            op.WOUNDS = (op.WOUNDS || 0) + Number(value);
            break;
        }
      }
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
    await this.repository.deleteOp(opId)
  }
}
