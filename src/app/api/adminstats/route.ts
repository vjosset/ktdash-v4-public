import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTimeZone, toZonedIsoDate } from '@/lib/utils/utils'
import { BattleService } from '@/services'
import { BattlePlain } from '@/types'
import { NextResponse } from 'next/server'

const RECENT_BATTLE_LIMIT = 30

// Get the stats
export async function GET(req: Request) {
  const session = await getAuthSession()
  if (!session?.user || session.user.userId != 'vince') return new NextResponse('Unauthorized', { status: 401 })

  // Days are bucketed in the viewer's zone, not the server's - the two are
  // rarely the same, and an evening event should land on the day the viewer
  // thinks it happened. Falls back to UTC when the client sends nothing usable.
  const timeZone = resolveTimeZone(new URL(req.url).searchParams.get('tz'))

  const days = getLastNDates(9, timeZone)

  // Query a UTC window a day wider on each side than the local days reported: a
  // zone can sit up to 14 hours off UTC, so a local day can begin on the previous
  // UTC day and end on the next. Rows outside the reported range land in buckets
  // that nothing reads.
  const startDate = new Date(`${days[days.length - 1]}T00:00:00Z`)
  startDate.setUTCDate(startDate.getUTCDate() - 1)
  const endDate = new Date(`${days[0]}T00:00:00Z`)
  endDate.setUTCDate(endDate.getUTCDate() + 2)

  const stats: {
    datestamp: Date
    totals: { users: number; rosters: number; ops: number }
    dailyStats: Record<string, any>
    portraitEvents: any[]
    recentBattles: BattlePlain[]
    activeVisitors30min: number
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
    recentBattles: [],
    activeVisitors30min: 0,
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
      select: { datestamp: true, userId: true, userIp: true, visitorId: true }
    }),
    prisma.webEvent.groupBy({
      by: ['visitorId', 'userIp'], // userIp is only here as the fallback key for rows with no visitorId
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
  
  // One visitor can appear on several rows (multiple IPs), so collapse them onto
  // the visitor key before counting
  stats.activeVisitors30min = new Set(
    recentActiveUsers
      .map(r => r.visitorId ?? r.userIp)
      .filter(Boolean)
  ).size
  stats.events30min = events30m

  // Group into { 'YYYY-MM-DD': count }
  const pageViewsPerDay: Record<string, number> = {}
  // Distinct visitors (browser/device), keyed on visitorId. Rows written before
  // visitorId shipped fall back to userIp so history isn't collapsed into one bucket.
  const distinctVisitorsPerDay = new Map<string, {
    all: Set<string>
    loggedIn: Set<string>
  }>()

  for (const e of pageViews) {
    const date = toZonedIsoDate(e.datestamp, timeZone)
    pageViewsPerDay[date] = (pageViewsPerDay[date] || 0) + 1

    const visitorKey = e.visitorId ?? e.userIp
    if (!visitorKey) continue

    if (!distinctVisitorsPerDay.has(date)) {
      distinctVisitorsPerDay.set(date, {
        all: new Set(),
        loggedIn: new Set()
      })
    }

    const bucket = distinctVisitorsPerDay.get(date)!
    bucket.all.add(visitorKey)

    // A visitor who browses anonymously and then logs in emits rows under the same
    // visitorId with two different userIds. Count them once, on the logged-in side,
    // and derive anonymous by subtraction below rather than counting '[anon]' rows.
    if (e.userId && e.userId !== '[anon]') {
      bucket.loggedIn.add(visitorKey)
    }
  }
  
  const signupsPerDay: Record<string, number> = {}

  for (const u of recentSignups) {
    const date = toZonedIsoDate(u.createdAt, timeZone)
    signupsPerDay[date] = (signupsPerDay[date] || 0) + 1
  }

  // Merge into array for frontend
  stats.dailyStats = days.map(date => {
    const visitorSets = distinctVisitorsPerDay.get(date)
    const uniqueVisitors = visitorSets?.all.size ?? 0
    const loggedInVisitors = visitorSets?.loggedIn.size ?? 0

    return {
      date,
      views: pageViewsPerDay[date] || 0,
      signups: signupsPerDay[date] || 0,
      uniqueVisitors,
      loggedInVisitors,
      anonymousVisitors: uniqueVisitors - loggedInVisitors
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

  // Gated on the same flag the roster and killteam pages read, so the admin view
  // doesn't advertise a feature that is switched off everywhere else
  if (process.env.NEXT_PUBLIC_ENABLE_BATTLES === 'true') {
    const recentBattles = await BattleService.getRecentBattles(RECENT_BATTLE_LIMIT)
    stats.recentBattles = recentBattles.map(b => b.toPlain())
  }

  return NextResponse.json(stats)
}

/*
  The last n calendar dates in the viewer's zone, newest first. Stepping happens
  on a UTC-midnight anchor so it stays pure calendar arithmetic - stepping a
  zoned Date instead would shift by an hour across a DST boundary and could
  repeat or skip a day.
*/
function getLastNDates(n: number, timeZone: string): string[] {
  const anchor = new Date(`${toZonedIsoDate(new Date(), timeZone)}T00:00:00Z`)
  const dates: string[] = []

  for (let i = 0; i < n; i++) {
    const d = new Date(anchor)
    d.setUTCDate(anchor.getUTCDate() - i)
    dates.push(d.toISOString().split('T')[0]) // 'YYYY-MM-DD'
  }

  return dates
}
