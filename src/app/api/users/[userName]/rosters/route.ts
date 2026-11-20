import { UserService } from '@/services/user.service'
import { NextResponse } from 'next/server'

/*
  A player's rosters as identities, so an opponent can be picked by username
  rather than by roster ID. Private players are reported as not found: they
  can be reached by roster ID only.
*/
export async function GET(req: Request, { params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params

  const rosters = await UserService.getRosterIdentitiesByUserName(userName)
  if (!rosters) {
    return NextResponse.json({ error: 'Player not found.' }, { status: 404 })
  }

  return NextResponse.json(rosters)
}
