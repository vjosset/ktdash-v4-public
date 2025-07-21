import { name_george } from '@/lib/namegen/george'
import { name_stacey } from '@/lib/namegen/stacey'
import { getRandom, ucwords } from '@/lib/utils/utils'
import { NextResponse } from 'next/server'

// Get a name with no nametype specified
// This is a fallback route that can be used when no specific nametype is provided
export async function GET(req: Request) {
  let nametype = 'GEORGE,STACEY'

  if (nametype.includes(',')) {
    const nametypes = nametype.split(',')
    nametype = getRandom(nametypes)
  }

  switch (nametype) {
  case 'STACEY':
    return new NextResponse(ucwords(name_stacey()), { status: 200, statusText: 'OK' })
  case 'GEORGE':
    return new NextResponse(ucwords(name_george()), { status: 200, statusText: 'OK' })
  default:
    return new NextResponse(nametype, { status: 200, statusText: 'OK' })
  }
}
