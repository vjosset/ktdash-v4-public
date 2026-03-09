import { getAuthSession } from '@/lib/auth'
import { MatchResultService } from '@/services/matchResult.service'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ matchResultId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { matchResultId } = await params
  const id = parseInt(matchResultId, 10)
  if (isNaN(id)) return new NextResponse('Invalid match result ID', { status: 400 })

  try {
    await MatchResultService.disputeMatch(id, session.user.userId)
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to dispute match'
    return new NextResponse(message, { status: 400 })
  }
}
