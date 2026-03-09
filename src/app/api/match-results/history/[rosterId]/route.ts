import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ rosterId: string }> }
) {
  const { rosterId } = await params
  const results = await MatchResultService.getMatchHistoryForRoster(rosterId)
  return NextResponse.json(results)
}
