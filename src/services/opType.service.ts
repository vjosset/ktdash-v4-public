import { OpTypeRepository } from '@/src/repositories/opType.repository'
import { OpType } from '@/types'

export class OpTypeService {
  private static repository = new OpTypeRepository()

  static async getOpTypeRow(opTypeId: string): Promise<OpType | null> {
    const opType = await this.repository.getOpTypeRow(opTypeId)
    return opType ? new OpType(opType) : null
  }

  static async getOpType(opTypeId: string): Promise<OpType | null> {
    const opType = await this.repository.getOpType(opTypeId)
    return opType ? new OpType(opType) : null
  }
}
