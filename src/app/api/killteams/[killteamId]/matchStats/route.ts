import { KillteamService } from '@/services/killteam.service'
import { MatchResultService } from '@/services/matchResult.service'
import { MATCH_STATS_PERIOD, isMatchStatsPeriod } from '@/types'
import { NextResponse } from 'next/server'

/*
  A killteam's record across all confirmed match results. Public, like the
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
    return NextResponse.json({ error: 'Match stats are not available for homebrew killteams.' }, { status: 404 })
  }

  const requested = new URL(req.url).searchParams.get('period')
  const period = isMatchStatsPeriod(requested) ? requested : MATCH_STATS_PERIOD.ALL

  const stats = await MatchResultService.getKillteamMatchStats(killteamId, period)
  return NextResponse.json(stats)
}
