import { getAuthSession } from '@/lib/auth'
import { BattleService } from '@/services/battle.service'
import { NextResponse } from 'next/server'

/*
  A roster page is public, so this is too - but it is viewer-aware: only the
  roster's owner sees battles still awaiting confirmation (rule 8).
*/
export async function GET(req: Request, { params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = await params

  const session = await getAuthSession()
  const battles = await BattleService.getBattlesForRoster(rosterId, session?.user?.userId)

  return NextResponse.json(battles.map(b => b.toPlain()))
}
