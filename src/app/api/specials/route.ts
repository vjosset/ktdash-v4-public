import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const rules = await prisma.weaponRule.findMany({
    orderBy: [ { code: 'asc' }]
  })

  return NextResponse.json(rules)
}
