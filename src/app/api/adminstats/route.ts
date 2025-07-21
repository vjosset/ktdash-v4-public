import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toLocalIsoDate } from '@/lib/utils/utils'
import { NextResponse } from 'next/server'

// Get the stats
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user || session.user.userId != 'vince') return new NextResponse('Unauthorized', { status: 401 })

  const stats = {
    totals: {
      users: 0,
      rosters: 0,
      ops: 0
    },
    dailyStats: {}
  }
  
  // Get the stats
  // Totals: Users, rosters, ops
  const [users, rosters, ops] = await Promise.all([
    prisma.user.count(),
    prisma.roster.count(),
    prisma.op.count()
  ])
  stats.totals = { users, rosters, ops }
  
  const days = getLastNDates(8)

  // Get all pageviews for last 7 days (in UTC)
  const startDate = new Date(days[days.length - 1])
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 1) // to include today fully

  const [pageViews] = await Promise.all([
    prisma.webEvent.findMany({
      where: {
        datestamp: {
          gte: startDate,
          lt: endDate
        },
        userIp: {
          notIn: ['127.0.0.1', '::1', '76.98.82.81', '73.188.188.13']
        }
      },
      select: { datestamp: true }
    })
  ])

  // Group into { 'YYYY-MM-DD': count }
  const pageViewsPerDay: Record<string, number> = {}

  for (const e of pageViews) {
    const date = toLocalIsoDate(e.datestamp)
    pageViewsPerDay[date] = (pageViewsPerDay[date] || 0) + 1
  }

  // Merge into array for frontend
  stats.dailyStats = days.map(date => ({
    date,
    views: pageViewsPerDay[date] || 0
  }))

  return NextResponse.json(stats)
}

function getLastNDates(n: number): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(d.toISOString().split('T')[0]) // 'YYYY-MM-DD'
  }

  return dates
}