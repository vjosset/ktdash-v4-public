import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const rows = await prisma.roster.findMany({
    where: {
      OR: [
        { rosterName: { contains: q } },
        { user: { userName: { contains: q } } },
      ],
    },
    select: {
      rosterId: true,
      rosterName: true,
      userId: true,
      user: { select: { userName: true } },
      killteam: { select: { killteamName: true } },
    },
    take: 20,
  })

  return NextResponse.json(
    rows.map((r) => ({
      rosterId: r.rosterId,
      rosterName: r.rosterName,
      userId: r.userId,
      userName: r.user?.userName ?? '',
      killteamName: r.killteam?.killteamName ?? '',
    }))
  )
}
