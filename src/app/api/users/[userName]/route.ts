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
      rosters: true
    },
  })

  return NextResponse.json(user)
}
