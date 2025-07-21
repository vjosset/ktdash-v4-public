import { KillteamService } from '@/services/killteam.service'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ killteamId: string }> }) {
  const { killteamId } = await params
  const killteam = await KillteamService.getKillteam(killteamId)
  if (!killteam) {
    return NextResponse.json({ error: 'Killteam not found' }, { status: 404 })
  }

  return NextResponse.json(killteam)
}
