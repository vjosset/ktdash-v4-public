import { getAuthSession } from '@/lib/auth'
import { BattleService } from '@/services/battle.service'
import { NextResponse } from 'next/server'

// Confirm a reported battle. Only roster B's owner may confirm (rule 3).
export async function PATCH(req: Request, { params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params
  const id = Number(battleId)

  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid battle id.' }, { status: 400 })
  }

  const battle = await BattleService.getBattle(id)
  if (!battle) {
    return NextResponse.json({ error: 'Battle not found.' }, { status: 404 })
  }

  if (battle.rosterB.userId !== session.user.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Rule 5: confirming is terminal, so re-confirming is a no-op, not an update
  if (battle.isConfirmed) {
    return NextResponse.json(battle.toPlain())
  }

  const confirmed = await BattleService.confirmBattle(id)
  return NextResponse.json(confirmed.toPlain())
}
