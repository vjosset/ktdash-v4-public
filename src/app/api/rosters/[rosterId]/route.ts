import { getAuthSession } from '@/lib/auth'
import { RosterService } from '@/services/roster.service'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params

  // Get the Roster
  const roster = await RosterService.getRoster(rosterId)

  // Return the Roster
  return NextResponse.json(roster)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params

  // Get the current user
  const session = await getAuthSession()

  // Check for unauthenticated
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  // Get the Roster to update
  const roster = await RosterService.getRosterRow(rosterId)

  // Check if this Roster belongs to current user
  if (!roster || roster.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Get the PATCH request in full
  const updates = await req.json()

  // Run the update (returns the updated object)
  const updated = await RosterService.updateRoster(rosterId, updates)

  return NextResponse.json(updated?.toPlain())
}

export async function DELETE(req: Request, { params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params
  
  // Get the current user
  const session = await getAuthSession()
  
  // Check for unauthenticated
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  // Get the Roster to delete
  const roster = await RosterService.getRosterRow(rosterId)
  
  // Check if this Roster belongs to current user
  if (!roster || roster.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Delete the record
  await RosterService.deleteRoster(rosterId)
  return NextResponse.json({ success: true })
}
