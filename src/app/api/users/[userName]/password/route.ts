import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserService } from '@/services'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params
  const { password } = await req.json()

  const session = await getAuthSession()
  if (!session?.user || session.user.userName != userName) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const hashed = await hash(password, 10)

  prisma: PrismaClient

  const res = await prisma.user.update( {
    where: { userId: session.user.userId },
    data: { password: hashed }
  })

  const user = await UserService.getUser(session.user.userId)
  return NextResponse.json(user)
}