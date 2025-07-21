import { OpService } from '@/services'
import { getAuthSession } from '@/src/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let updates
  try {
    updates = await req.json()
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 })
  }

  if (!Array.isArray(updates) || !updates.every(op => op.opId && typeof op.seq === 'number')) {
    return new NextResponse('Invalid request body', { status: 400 })
  }

  try {
    for (var update of updates) {
      // Check if the user is allowed to update this op
      const op = await OpService.getOp(update.opId)
      if (op == null) {
        throw "Op not found"
      }
      if (!op || !op.roster) {
        return new NextResponse('Op not found', { status: 404 })
      }
      if (op.roster.userId !== session.user.userId) {
        return new NextResponse('Forbidden', { status: 403 })
      }
      // Update the roster order
      await OpService.updateOp(update.opId, {seq: update.seq})
    }
    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    console.error('Failed to update roster order', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
