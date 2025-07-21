import type { OpType } from '@prisma/client'
import { BaseRepository } from './base.repository'

export class OpTypeRepository extends BaseRepository {
  async getOpTypeRow(opTypeId: string): Promise<OpType | null> {
    return this.prisma.opType.findUnique({
      where: { opTypeId }
    })
  }

  async getOpType(opTypeId: string) {
    return this.prisma.opType.findUnique({
      where: { opTypeId },
      //include: {
      //  weapons: {
      //    orderBy: [
      //      { seq: 'asc' },
      //      { wepName: 'asc' }
      //    ],
      //    include: {
      //      profiles: {
      //        orderBy: { seq: 'asc' }
      //      }
      //    }
      //  }
      //}
    })
  }
}