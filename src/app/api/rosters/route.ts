import { getAuthSession } from '@/lib/auth'
import { RosterService } from '@/services/roster.service'
import { NextResponse } from 'next/server'

// Create new roster
export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  // Get the request payload
  const data = await req.json()

  // Force the roster to belong to current user
  data.userId = session.user.userId

  // Create the roster
  const roster = await RosterService.createRoster(data)

  return NextResponse.json(roster)
}
