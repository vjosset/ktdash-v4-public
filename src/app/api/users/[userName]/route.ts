import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Get all rosters for specified user
export async function GET(req: Request, { params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params

  const user = await prisma.user.findUnique({
    where: { userName },
    select: {
      userId: true,
      userName: true,
      isPrivate: true,
      rosters: true
    },
  })

  return NextResponse.json(user)
}

// Update user settings (e.g. isPrivate)
export async function PATCH(req: Request, { params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params

  const session = await getAuthSession()
  if (!session?.user || (session.user.userName !== userName && session.user.userId !== 'vince')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await req.json()

  // Allowlist of user-editable fields
  const updates: { isPrivate?: boolean } = {}
  if (typeof body.isPrivate === 'boolean') updates.isPrivate = body.isPrivate

  if (Object.keys(updates).length === 0) {
    return new NextResponse('No valid fields to update', { status: 400 })
  }

  const user = await prisma.user.update({
    where: { userName },
    data: updates,
    select: { userId: true, userName: true, isPrivate: true },
  })

  return NextResponse.json(user)
}
