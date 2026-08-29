import { RosterService } from '@/services/roster.service'
import { NextResponse } from 'next/server'

/*
  Name, owner and killteam for one roster - nothing else. Public, like the roster
  page itself, and deliberately leaner than GET /api/rosters/{rosterId}, which
  returns every op. Used to resolve a pasted roster ID before reporting a battle.
*/
export async function GET(req: Request, { params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params

  const identity = await RosterService.getRosterIdentityRow(rosterId)
  if (!identity) {
    return NextResponse.json({ error: 'Roster not found.' }, { status: 404 })
  }

  return NextResponse.json(identity)
}
