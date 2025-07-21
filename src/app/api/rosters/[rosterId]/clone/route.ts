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
  
  // Get the request payload
  const data = (await req.json()) ?? null

  // Get Roster to clone
  const rosterRow = await RosterService.getRosterRow(rosterId)
  if (!rosterRow) return new NextResponse('Roster not found', { status: 404 })

  const newRosterName = data.rosterName ? data.rosterName : (rosterRow.userId == session.user.userId ? `${rosterRow.rosterName} - Copy` : `${rosterRow.rosterName}`)
  
  // Now create the roster and its ops
  const newRoster = await RosterService.cloneRoster(rosterId, session.user.userId, newRosterName)
  if (!newRoster) {
    return new NextResponse('Failed to create roster', { status: 500 })
  }

  return NextResponse.json(newRoster.toPlain())
}
