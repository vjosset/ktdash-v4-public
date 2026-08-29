import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

/*
  A roster page is public, so this is too - but it is viewer-aware: only the
  roster's owner sees results still awaiting confirmation (rule 8).
*/
export async function GET(req: Request, { params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params

  const session = await getAuthSession()
  const matchResults = await MatchResultService.getMatchResultsForRoster(rosterId, session?.user?.userId)

  return NextResponse.json(matchResults.map(m => m.toPlain()))
}
