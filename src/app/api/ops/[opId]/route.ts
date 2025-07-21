import { getAuthSession } from '@/lib/auth'
import { OpService } from '@/services/op.service'
import { RosterService } from '@/services/roster.service'
import { NextResponse } from 'next/server'

// Get a Op
export async function GET(req: Request, { params }: { params: Promise<{ opId: string }> }) {
  const { opId } = await params
  const op = await OpService.getOp(opId)
  if (!op) return new NextResponse('Not Found', { status: 404 })

  return NextResponse.json(op)
}

// Update a Op
export async function PATCH(req: Request, { params }: { params: Promise<{ opId: string }> }) {
  const { opId } = await params
  const { opName, currWOUNDS, isActivated, wepIds, optionIds, opOrder } = await req.json()

  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const op = await OpService.getOp(opId)

  const rosterRow = (op && op.rosterId) ? await RosterService.getRosterRow(op.rosterId) : null

  if (!op || !op.rosterId || !rosterRow || rosterRow.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const updates = {
    opName,
    opId,
    wepIds,
    optionIds,
    currWOUNDS,
    isActivated,
    opOrder
  }

  const newOp = await OpService.updateOp(opId, updates)

  if (!newOp) return new NextResponse('Error', { status: 500 })

  // Pull the roster rather than the Op since getRoster applies equipments which aren't directly part of the operative
  const roster = await RosterService.getRoster(op.rosterId)

  const finalOp = roster?.ops?.find((op) => op.opId == opId)
  if (!finalOp) return new NextResponse('Error', { status: 500 })
  return NextResponse.json(finalOp.toPlain())
}

// Delete an op
export async function DELETE(req: Request, { params }: { params: Promise<{ opId: string }> }) {
  const { opId } = await params
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const op = await OpService.getOpRow(opId)

  const roster = (op && op.rosterId) ? await RosterService.getRosterRow(op.rosterId) : null

  if (!op || !roster || roster.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  await OpService.deleteOp(opId)
  return NextResponse.json({ success: true })
}
