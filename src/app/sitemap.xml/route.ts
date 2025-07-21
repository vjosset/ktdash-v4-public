import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://ruinstars.com'

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
  })

  // Fetch rosters
  const rosters = await prisma.roster.findMany({
    select: { rosterId: true },
  })

  // Fetch users
  const users = await prisma.user.findMany({
    select: { userName: true },
  })

  const dynamicUrls = [
    ...killteams.map(killteam => `/killteams/${killteam.killteamId}`),
    ...users.map(user => `/users/${user.userName}`),
    ...rosters.map(roster => `/rosters/${roster.rosterId}`),
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
