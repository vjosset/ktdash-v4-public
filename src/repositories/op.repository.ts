import type { Op } from '@prisma/client'
import { BaseRepository } from './base.repository'

export class OpRepository extends BaseRepository {
  async getOpRow(opId: string): Promise<Op | null> {
    return this.prisma.op.findUnique({
      where: { opId }
    })
  }

  async getOp(opId: string) {
    return this.prisma.op.findUnique({
      where: { opId },
      include: {
        roster: true,
        opType: {
          include: {
            weapons: {
              include: {
                profiles: {
                  orderBy: { seq: 'asc' }
                }
              },
              orderBy:[
                { wepType: 'desc'},
                { seq: 'asc' },
              ]
            },
            options: {
              orderBy:[
                { seq: 'asc' },
              ]
            },
            abilities: true,
          }
        },
      }
    })
  }

  async createOp(data: Partial<Op>) {
    return this.prisma.op.create({
      data: {
        opId: data.opId ?? '',
        opTypeId: data.opTypeId ?? '',
        currWOUNDS: data.currWOUNDS ?? 0,
        opName: data.opName ?? '',
        seq: data.seq ?? 0,
        isActivated: false,
        opOrder: 'concealed',
        wepIds: data.wepIds ?? '',
        optionIds: data.optionIds ?? '',
        rosterId: data.rosterId ?? ''
      }
    })
  }

  async updateOp(opId: string, data: Partial<Op>) {
    return this.prisma.op.update({
      where: { opId },
      data
    })
  }

  async deleteOp(opId: string) {
    return this.prisma.op.delete({
      where: { opId }
    })
  }
}
