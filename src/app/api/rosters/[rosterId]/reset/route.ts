import { getAuthSession } from '@/lib/auth'
import { RosterService } from '@/services'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ rosterId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { rosterId } = await params

  // Check ownership
  const roster = await RosterService.getRosterRow(rosterId)

  if (!roster || roster.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  const newRoster = await RosterService.resetRoster(rosterId)
  if (!newRoster) {
    return new NextResponse('Failed to reset roster', { status: 500 })
  }

  return NextResponse.json(newRoster.toPlain())
}
