import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { RosterService } from '@/services/roster.service'
import { isMatchOutcome } from '@/types'
import { NextResponse } from 'next/server'

// Report a match result. The reporter always goes into slot A.
export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { rosterAId, rosterBId, result, acknowledgeDuplicate } = await req.json()

  if (!rosterAId || !rosterBId) {
    return NextResponse.json({ error: 'Both rosters are required.' }, { status: 400 })
  }

  if (!isMatchOutcome(result)) {
    return NextResponse.json({ error: 'Invalid match outcome.' }, { status: 400 })
  }

  const rosterA = await RosterService.getRosterIdentityRow(rosterAId)
  if (!rosterA) {
    return NextResponse.json({ error: 'Your roster was not found.' }, { status: 404 })
  }

  // Rule 1: only a roster owner may report a match involving their roster
  if (rosterA.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const rosterB = await RosterService.getRosterIdentityRow(rosterBId)
  if (!rosterB) {
    return NextResponse.json({ error: 'Opponent roster not found. Check the ID and try again.' }, { status: 404 })
  }

  const outcome = await MatchResultService.createMatchResult({
    rosterA,
    rosterB,
    result,
    acknowledgeDuplicate: acknowledgeDuplicate === true,
  })

  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.error, duplicateOf: outcome.duplicateOf },
      { status: outcome.status },
    )
  }

  return NextResponse.json(outcome.matchResult.toPlain())
}
