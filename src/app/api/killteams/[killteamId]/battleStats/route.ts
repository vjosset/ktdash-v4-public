import { KillteamService } from '@/services/killteam.service'
import { BattleService } from '@/services/battle.service'
import { BATTLE_STATS_PERIOD, isBattleStatsPeriod } from '@/types'
import { NextResponse } from 'next/server'

/*
  A killteam's record across all confirmed battles. Public, like the
  killteam page. Homebrew teams are excluded entirely - their rosters are too
  few and too fluid for the numbers to mean anything.
*/
export async function GET(req: Request, { params }: { params: Promise<{ killteamId: string }> }) {
  const { killteamId } = await params

  const killteam = await KillteamService.getKillteamRow(killteamId)
  if (!killteam) {
    return NextResponse.json({ error: 'Killteam not found.' }, { status: 404 })
  }

  if (killteam.isHomebrew) {
    return NextResponse.json({ error: 'Battle stats are not available for homebrew killteams.' }, { status: 404 })
  }

  const requested = new URL(req.url).searchParams.get('period')
  const period = isBattleStatsPeriod(requested) ? requested : BATTLE_STATS_PERIOD.ALL

  const stats = await BattleService.getKillteamBattleStats(killteamId, period)
  return NextResponse.json(stats)
}
