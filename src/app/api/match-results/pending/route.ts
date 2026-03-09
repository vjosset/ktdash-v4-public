import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const results = await MatchResultService.getPendingMatchesForUser(session.user.userId)
  return NextResponse.json(results)
}
