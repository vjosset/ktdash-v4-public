import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { rosterAId, rosterBId, result } = body

  if (!rosterAId || !rosterBId || !result) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  try {
    const matchResult = await MatchResultService.createPendingMatch(
      rosterAId,
      rosterBId,
      result,
      session.user.userId
    )
    return NextResponse.json(matchResult)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create match result'
    return new NextResponse(message, { status: 400 })
  }
}
