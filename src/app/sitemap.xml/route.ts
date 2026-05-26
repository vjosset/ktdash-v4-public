import { GAME } from '@/lib/config/game_config'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Force dynamic server-side render for this page instead of static at build time
export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = GAME.ROOT_URL

  // Static URLs
  const staticUrls = [
    '/',
    '/rules',
    '/killteams',
    '/auth/login',
    '/auth/signup',
  ]

  // Fetch killteams
  const killteams = await prisma.killteam.findMany({
    select: { killteamId: true },
    where: { isPublished: true }
  })

  // Fetch rosters
  const rosters = await prisma.roster.findMany({
    where: {
      isSpotlight: true,
      user: { isPrivate: false },
    },
    select: { rosterId: true },
  })

  // Fetch users
  const users = await prisma.user.findMany({
    where: { // Only non-private users with at least one spotlighted roster
      isPrivate: false,
      rosters: {
        some: {
          isSpotlight: true,
        },
      },
    },
    select: { userName: true },
  })

  const dynamicUrls = [
    ...killteams.map(killteam => `/killteams/${killteam.killteamId}`),
    ...users.map(user => `/users/${encodeURIComponent(user.userName)}`),
    ...rosters.map(roster => `/rosters/${roster.rosterId}`),
    ...rosters.map(roster => `/rosters/${roster.rosterId}/gallery`),
  ]

  // Build full list of URLs
  const urls = [...staticUrls, ...dynamicUrls]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
    .map(
      url => `
      <url>
        <loc>${baseUrl}${url}</loc>
      </url>`
    )
    .join('')}
  </urlset>`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
