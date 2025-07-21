import { getAuthSession } from '@/lib/auth'
import { NextResponse, userAgent } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { headers } from 'next/headers'

// Allow only POST requests
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const session = await getAuthSession()
    const userId = session?.user.userId ?? '[anon]'
    const headersList = await headers()
    const userIp = headersList.get('x-forwarded-for') ?? ''

    const event = await prisma.webEvent.create({
      data: {
        eventType: (body.t ?? '').substring(0, 50),
        action: (body.a ?? '').substring(0, 45),
        label: (body.l ?? '').substring(0, 45),
        var1: (body.v1 ?? '').substring(0, 45),
        var2: (body.v2 ?? '').substring(0, 45),
        var3: (body.v3 ?? '').substring(0, 45),
        url: (body.u ?? '').substring(0, 500),
        sessionType: (body.s ?? '').substring(0, 50),
        referrer: (body.r ?? '').substring(0, 500),
        userAgent: userAgent(req).ua,
        userIp: userIp,
        userId: userId
      },
    })

    return NextResponse.json({ status: 'OK', eventId: event.eventId }, { status: 201 })
  } catch (error) {
    console.error('Failed to record event:', error)
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}

// (Optional) handle OPTIONS preflight
export function OPTIONS() {
  return NextResponse.json({}, { status: 204 })
}
