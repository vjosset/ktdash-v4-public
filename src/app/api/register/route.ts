import { prisma } from '@/lib/prisma'
import { genId } from '@/lib/utils/utils'
import { RosterService } from '@/services'
import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userName, password } = await req.json()

  if (!userName || !password) {
    return new NextResponse('Missing fields', { status: 400 })
  }

  if (userName.length < 4) {
    return new NextResponse('UserName is too short (minimum 4 characters)', { status: 400 })
  }

  if (password.length < 6) {
    return new NextResponse('Password is too short (minimum 6 characters)', { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { userName } })
  if (existing) {
    return new NextResponse('User already exists', { status: 409 })
  }

  const hashed = await hash(password, 10)

  const user = await prisma.user.create({
    data: {
      userId: genId(),
      userName,
      password: hashed,
    },
  })

  if (!user) return new NextResponse('Could not register new user', { status: 500 })

  // Now clone the default roster
  RosterService.cloneRoster('IMP-AOD', user.userId, 'Sample Roster')

  return NextResponse.json({ success: true, userid: user.userId })
}
