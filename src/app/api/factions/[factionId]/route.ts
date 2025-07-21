import { FactionService } from '@/services/faction.service'
import { Killteam } from '@/types'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ factionId: string }> }) {
  const { factionId } = await params
  const faction = await FactionService.getFaction(factionId)
  if (!faction) {
    return NextResponse.json({ error: 'Killteam not found' }, { status: 404 })
  }

  const killteams = faction.killteams?.map((kt: Killteam) => {
    const proto = new Killteam(kt)
    return proto.toPlain()
  })

  return NextResponse.json(faction)
}
