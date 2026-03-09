import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const session = await getAuthSession()
  const isOwner = session?.user?.userId === userId
  const results = await MatchResultService.getMatchHistoryForUser(userId, !isOwner)
  return NextResponse.json(results)
}
