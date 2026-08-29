import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

/*
  Remove a pending match result. Either owner may do this while it is pending:
  roster B's owner deleting it is a dispute, roster A's owner deleting it is a
  retraction. Both mean the same thing to the data.
*/
export async function DELETE(req: Request, { params }: { params: Promise<{ matchResultId: string }> }) {
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

  // Rule 5: confirming is terminal
  if (matchResult.isConfirmed) {
    return NextResponse.json({ error: 'A confirmed result cannot be removed.' }, { status: 409 })
  }

  // Rule 4
  const userId = session.user.userId
  if (matchResult.rosterA.userId !== userId && matchResult.rosterB.userId !== userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  await MatchResultService.deleteMatchResult(id)
  return NextResponse.json({ success: true })
}
