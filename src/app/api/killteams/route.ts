import { KillteamService } from '@/services/killteam.service'
import { NextResponse } from 'next/server'

// Get all killteams
export async function GET() {
  const killteams = await KillteamService.getAllKillteams()

  return NextResponse.json(killteams)
}
