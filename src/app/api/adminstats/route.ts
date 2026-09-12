import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { resolveTimeZone, toZonedIsoDate, zonedDayStartUtc } from '@/lib/utils/utils'
import { BattleService } from '@/services'
import { BattlePlain } from '@/types'
import { NextResponse } from 'next/server'

const RECENT_BATTLE_LIMIT = 30

// COUNT() comes back from a raw MySQL query as BigInt, never a number
type DailyEventRow = {
  day: string
  views: bigint
  uniqueVisitors: bigint
  loggedInVisitors: bigint
}

type DailySignupRow = {
  day: string
  signups: bigint
}

// Get the stats
export async function GET(req: Request) {
  console.debug('Starting admin stats', (new Date()))

  const session = await getAuthSession()
  if (!session?.user || session.user.userId != 'vince') return new NextResponse('Unauthorized', { status: 401 })

  // Days are bucketed in the viewer's zone, not the server's - the two are
  // rarely the same, and an evening event should land on the day the viewer
  // thinks it happened. Falls back to UTC when the client sends nothing usable.
  const timeZone = resolveTimeZone(new URL(req.url).searchParams.get('tz'))

  const days = getLastNDates(9, timeZone)

  // The exact UTC instants each reported local day begins at, newest first. A
  // zone can sit up to 14 hours off UTC, so these are not UTC midnights - the
  // database buckets rows by comparing against them.
  const dayStarts = days.map(d => zonedDayStartUtc(d, timeZone))
  const startDate = dayStarts[dayStarts.length - 1]

  const dayAfterNewest = new Date(`${days[0]}T00:00:00Z`)
  dayAfterNewest.setUTCDate(dayAfterNewest.getUTCDate() + 1)
  const endDate = zonedDayStartUtc(dayAfterNewest.toISOString().split('T')[0], timeZone)

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
  console.debug('Get totals', (new Date()))
  const [users, rosters, ops] = await Promise.all([
    prisma.user.count(),
    prisma.roster.count(),
    prisma.op.count()
  ])

  stats.totals = { users, rosters, ops }

  const cutoff30m = new Date(Date.now() - 30 * 60 * 1000)
  const excludedIps = ['127.0.0.1', '::1', '76.98.82.81', '73.188.188.13', '73.165.66.83', '68.80.166.102']
  const excludedUserIds = ['vince']

  /*
    Which reported day a timestamp falls on, decided by the database against the
    zone boundaries above. Days run newest first and the queries only ever see
    rows inside the window, so the first branch that matches is the right one.
  */
  const dayBucket = (column: Prisma.Sql) => Prisma.sql`CASE ${Prisma.join(
    dayStarts.map((start, i) => Prisma.sql`WHEN ${column} >= ${start} THEN ${days[i]}`),
    ' '
  )} END`

  /*
    Counting happens in SQL. Pulling every event in the window back to bucket it
    here meant thousands of rows over the wire and seconds of formatting per
    request; the database groups the same rows in one pass and returns nine.
    userId NOT IN also drops rows with a null userId, which is what the Prisma
    notIn filter this replaced did.
  */
  console.debug('Get daily stats, active', (new Date()))
  const [dailyEvents, dailySignups, recentActiveUsers, events30m] = await Promise.all([
    prisma.$queryRaw<DailyEventRow[]>`
      SELECT
        ${dayBucket(Prisma.raw('e.datestamp'))} AS day,
        COUNT(*) AS views,
        COUNT(DISTINCT NULLIF(COALESCE(e.visitorId, e.userIp), '')) AS uniqueVisitors,
        COUNT(DISTINCT CASE
          WHEN e.userId IS NOT NULL AND e.userId <> '[anon]'
          THEN NULLIF(COALESCE(e.visitorId, e.userIp), '')
        END) AS loggedInVisitors
      FROM \`WebEvent\` e
      WHERE e.datestamp >= ${startDate}
        AND e.datestamp < ${endDate}
        AND e.userIp NOT IN (${Prisma.join(excludedIps)})
        AND e.userId NOT IN (${Prisma.join(excludedUserIds)})
      GROUP BY day
    `,
    prisma.$queryRaw<DailySignupRow[]>`
      SELECT
        ${dayBucket(Prisma.raw('u.createdAt'))} AS day,
        COUNT(*) AS signups
      FROM \`User\` u
      WHERE u.createdAt >= ${startDate}
        AND u.createdAt < ${endDate}
      GROUP BY day
    `,
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

  const eventsByDay = new Map(dailyEvents.map(r => [r.day, r]))
  const signupsByDay = new Map(dailySignups.map(r => [r.day, Number(r.signups)]))

  // Merge into array for frontend
  console.debug('Build daily stats', (new Date()))
  stats.dailyStats = days.map(date => {
    const row = eventsByDay.get(date)

    // A visitor who browses anonymously and then logs in emits rows under the same
    // visitorId with two different userIds. The query counts them once, on the
    // logged-in side, so anonymous comes out by subtraction rather than off '[anon]' rows.
    const uniqueVisitors = Number(row?.uniqueVisitors ?? 0)
    const loggedInVisitors = Number(row?.loggedInVisitors ?? 0)

    return {
      date,
      views: Number(row?.views ?? 0),
      signups: signupsByDay.get(date) ?? 0,
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

  console.debug('Build response', (new Date()))
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
