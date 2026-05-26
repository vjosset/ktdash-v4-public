import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { toLocalIsoDate } from '@/lib/utils/utils'
import { NextResponse } from 'next/server'

// Get the stats
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user || session.user.userId != 'vince') return new NextResponse('Unauthorized', { status: 401 })
    
  const days = getLastNDates(9)
  const startDate = new Date(days[days.length - 1])
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 1) // to include today fully

  const stats: {
    datestamp: Date
    totals: { users: number; rosters: number; ops: number }
    dailyStats: Record<string, any>
    portraitEvents: any[]
    activeUsers30min: number
    events30min: number
  } = {
    datestamp: new Date(),
    totals: {
      users: 0,
      rosters: 0,
      ops: 0
    },
    dailyStats: {},
    portraitEvents: [],
    activeUsers30min: 0,
    events30min: 0
  }
  
  // Get the stats
  // Totals: Users, rosters, ops
  const [users, rosters, ops, recentSignups] = await Promise.all([
    prisma.user.count(),
    prisma.roster.count(),
    prisma.op.count(),
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        createdAt: true
      }
    })
  ])

  stats.totals = { users, rosters, ops }
  
  const cutoff30m = new Date(Date.now() - 30 * 60 * 1000)
  const excludedIps = ['127.0.0.1', '::1', '76.98.82.81', '73.188.188.13', '73.165.66.83', '68.80.166.102']
  const excludedUserIds = ['vince']

  const [pageViews, recentActiveUsers, events30m] = await Promise.all([
    prisma.webEvent.findMany({
      where: {
        datestamp: {
          gte: startDate,
          lt: endDate
        },
        userIp: {
          notIn: excludedIps
        },
        userId: {
          notIn: excludedUserIds
        }
      },
      select: { datestamp: true, userId: true, userIp: true }
    }),
    prisma.webEvent.groupBy({
      by: ['userId', 'userIp'], // distinct concat equivalent
      where: {
        datestamp: { gte: cutoff30m },
        userIp: { notIn: excludedIps },
        userId: { notIn: excludedUserIds }
      },
      _count: { _all: true }
    }),
    prisma.webEvent.count({
      where: {
        datestamp: { gte: cutoff30m },
        // optional: match same IP filter as above
        userIp: { notIn: excludedIps },
        userId: { notIn: excludedUserIds }
      }
    })
  ])
  
  stats.activeUsers30min = recentActiveUsers.length
  stats.events30min = events30m

  // Group into { 'YYYY-MM-DD': count }
  const pageViewsPerDay: Record<string, number> = {}
  const distinctUsersPerDay = new Map<string, {
    all: Set<string>
    loggedIn: Set<string>
    anonymous: Set<string>
  }>()

  for (const e of pageViews) {
    const date = toLocalIsoDate(e.datestamp)
    pageViewsPerDay[date] = (pageViewsPerDay[date] || 0) + 1

    if (!distinctUsersPerDay.has(date)) {
      distinctUsersPerDay.set(date, {
        all: new Set(),
        loggedIn: new Set(),
        anonymous: new Set()
      })
    }

    const bucket = distinctUsersPerDay.get(date)!

    if (e.userId && e.userId !== '[anon]') {
      bucket.loggedIn.add(e.userId)
      bucket.all.add(`user:${e.userId}`)
    } else if (e.userIp) {
      bucket.anonymous.add(e.userIp)
      bucket.all.add(`anon:${e.userIp}`)
    }
  }
  
  const signupsPerDay: Record<string, number> = {}

  for (const u of recentSignups) {
    const date = toLocalIsoDate(u.createdAt)
    signupsPerDay[date] = (signupsPerDay[date] || 0) + 1
  }

  // Merge into array for frontend
  stats.dailyStats = days.map(date => {
    const userSets = distinctUsersPerDay.get(date)
    const uniqueLoggedInUsers = userSets?.loggedIn.size ?? 0
    const uniqueAnonymousUsers = userSets?.anonymous.size ?? 0

    return {
      date,
      views: pageViewsPerDay[date] || 0,
      signups: signupsPerDay[date] || 0,
      uniqueUsers: userSets?.all.size ?? 0,
      uniqueLoggedInUsers,
      uniqueAnonymousUsers
    }
  })

  const recentPortraitEvents = await prisma.webEvent.findMany({
    where: {
      eventType: 'roster',
      action: {
        in: ['portrait', 'opportrait']
      },
      datestamp: {
        gte: new Date(new Date().getTime() - (48 * 60 * 60 * 1000))
      }
    },
    select: {
      datestamp: true,
      var1: true // rosterId
    }
  })
  const recentRosterActivity = new Map<string, Date>()

  for (const { var1: rosterId, datestamp } of recentPortraitEvents) {
    if (!rosterId) continue
    const current = recentRosterActivity.get(rosterId)
    if (!current || datestamp > current) {
      recentRosterActivity.set(rosterId, datestamp)
    }
  }

  const rosterIds = Array.from(recentRosterActivity.keys())

  const portraitRosters = await prisma.roster.findMany({
    where: {
      rosterId: { in: rosterIds }
    },
    include: {
      ops: {
        select: { opId: true, hasCustomPortrait: true }
      },
      user: {
        select: { userName: true, isPrivate: true }
      },
      killteam: {
        select: { killteamName: true }
      }
    }
  })

  const portraitCompleteRosters = portraitRosters
  .map(r => {
    const totalOps = r.ops.length
    const customOps = r.ops.filter(op => op.hasCustomPortrait).length
    const isComplete = totalOps > 0 && totalOps === customOps && r.hasCustomPortrait

    return {
      rosterId: r.rosterId,
      rosterName: r.rosterName,
      isSpotlight: r.isSpotlight,
      userName: r.user?.userName ?? 'Unknown',
      isPrivate: r.user?.isPrivate ?? false,
      killteamName: r.killteam?.killteamName ?? 'Unknown',
      hasCustomPortrait: r.hasCustomPortrait,
      totalOps,
      customOps,
      isComplete,
      latestEventAt: recentRosterActivity.get(r.rosterId) ?? null
    }
  })
  .sort((a, b) => b.latestEventAt!.getTime() - a.latestEventAt!.getTime())

  stats.portraitEvents = portraitCompleteRosters

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
