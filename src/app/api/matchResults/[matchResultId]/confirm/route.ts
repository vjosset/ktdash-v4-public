import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

// Confirm a reported match result. Only roster B's owner may confirm (rule 3).
export async function PATCH(req: Request, { params }: { params: Promise<{ matchResultId: string }> }) {
  const { matchResultId } = await params
  const id = Number(matchResultId)

  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid match result id.' }, { status: 400 })
  }

  const matchResult = await MatchResultService.getMatchResult(id)
  if (!matchResult) {
    return NextResponse.json({ error: 'Match result not found.' }, { status: 404 })
  }

  if (matchResult.rosterB.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Rule 5: confirming is terminal, so re-confirming is a no-op, not an update
  if (matchResult.isConfirmed) {
    return NextResponse.json(matchResult.toPlain())
  }

  const confirmed = await MatchResultService.confirmMatch(id)
  return NextResponse.json(confirmed.toPlain())
}
