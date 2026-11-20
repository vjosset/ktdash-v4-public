import { getAuthSession } from '@/lib/auth'
import { BattleService } from '@/services/battle.service'
import { NextResponse } from 'next/server'

// The signed-in user's recent opponents, for the opponent picker's quick picks
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  // Battles are still behind a flag - with it off there is no history to draw on
  if (process.env.NEXT_PUBLIC_ENABLE_BATTLES !== 'true') return NextResponse.json([])

  const opponents = await BattleService.getRecentOpponents(session.user.userId)
  return NextResponse.json(opponents)
}
