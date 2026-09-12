import { getAuthSession } from '@/lib/auth'
import { BattleService } from '@/services/battle.service'
import { NextResponse } from 'next/server'

/*
  Remove a pending battle. Either owner may do this while it is pending:
  roster B's owner deleting it is a dispute, roster A's owner deleting it is a
  retraction. Both mean the same thing to the data.
*/
export async function DELETE(req: Request, { params }: { params: Promise<{ battleId: string }> }) {
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

  // Rule 5: confirming is terminal
  if (battle.isConfirmed) {
    return NextResponse.json({ error: 'A confirmed battle cannot be removed.' }, { status: 409 })
  }

  // Rule 4
  const userId = session.user.userId
  if (battle.rosterA.userId !== userId && battle.rosterB.userId !== userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  await BattleService.deleteBattle(id)
  return NextResponse.json({ success: true })
}
