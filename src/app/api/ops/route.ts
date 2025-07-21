import { getAuthSession } from '@/lib/auth'
import { OpService, RosterService } from '@/src/services'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { opName, opTypeId, rosterId, wepIds, optionIds, currWOUNDS } = await req.json()

  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const roster = await RosterService.getRoster(rosterId)

  // Check if the roster belongs to this user
  if (!roster || roster?.userId !== session?.user.userId) return new NextResponse('Forbidden', { status: 403 })

  // Set the seq on this new op to be the last one
  const seq = roster.ops? roster.ops.length + 1 : 1

  const op = await OpService.createOp({
    opName,
    opTypeId,
    rosterId,
    seq,
    wepIds,
    optionIds: optionIds ?? '',
    currWOUNDS,
    opOrder: 'concealed',
    isActivated: false
  })

  if (!op) return new NextResponse('Failed to create op', { status: 500 })
  return NextResponse.json(op.toPlain())
}
