import { name_admech } from '@/lib/namegen/admech'
import { name_aesbaer } from '@/lib/namegen/aesbaer'
import { name_bearaxe } from '@/lib/namegen/bearaxe'
import { name_beastman } from '@/lib/namegen/beastman'
import { name_corvius } from '@/lib/namegen/corvius'
import { name_cultist } from '@/lib/namegen/cultist'
import { name_czigheo } from '@/lib/namegen/czigheo'
import { name_decaeta } from '@/lib/namegen/decaeta'
import { name_fyhucho } from '@/lib/namegen/fyhucho'
import { name_george } from '@/lib/namegen/george'
import { name_hierotek } from '@/lib/namegen/hierotek'
import { name_kassothor } from '@/lib/namegen/kassothor'
import { name_kroot } from '@/lib/namegen/kroot'
import { name_necron } from '@/lib/namegen/necron'
import { name_ork } from '@/lib/namegen/ork'
import { name_stacey } from '@/lib/namegen/stacey'
import { name_tau } from '@/lib/namegen/tau'
import { name_tyranid } from '@/lib/namegen/tyranid'
import { getRandom, ucwords } from '@/lib/utils/utils'
import { NextResponse } from 'next/server'

// Get a name
export async function GET(req: Request, { params }: { params: Promise<{ nametype: string }> }) {
  let { nametype } = await params

  if (nametype == '') {
    // Default to generic human
    nametype = 'GEORGE,STACEY'
  }

  if (nametype.includes(',')) {
    const nametypes = nametype.split(',')
    nametype = getRandom(nametypes)
  }

  switch (nametype) {
  case 'AESBAER':
    return new NextResponse(ucwords(name_aesbaer()), { status: 200, statusText: 'OK' })
  case 'CORVIUS':
    return new NextResponse(ucwords(name_corvius()), { status: 200, statusText: 'OK' })
  case 'DECAETA':
    return new NextResponse(ucwords(name_decaeta()), { status: 200, statusText: 'OK' })
  case 'FYHUCHO':
    return new NextResponse(ucwords(name_fyhucho()), { status: 200, statusText: 'OK' })
  case 'BEARAXE':
    return new NextResponse(ucwords(name_bearaxe()), { status: 200, statusText: 'OK' })
  case 'CZIGHEO':
    return new NextResponse(ucwords(name_czigheo()), { status: 200, statusText: 'OK' })
  case 'STACEY':
    return new NextResponse(ucwords(name_stacey()), { status: 200, statusText: 'OK' })
  case 'GEORGE':
    return new NextResponse(ucwords(name_george()), { status: 200, statusText: 'OK' })
  case 'ADMECH':
    return new NextResponse(ucwords(name_admech()), { status: 200, statusText: 'OK' })
  case 'HIEROTEK':
    return new NextResponse(ucwords(name_hierotek()), { status: 200, statusText: 'OK' })
  case 'NECRON':
    return new NextResponse(ucwords(name_necron()), { status: 200, statusText: 'OK' })
  case 'KASSOTHOR':
    return new NextResponse(ucwords(name_kassothor()), { status: 200, statusText: 'OK' })
  case 'ORK':
    return new NextResponse(ucwords(name_ork()), { status: 200, statusText: 'OK' })
  case 'BEASTMAN':
    return new NextResponse(ucwords(name_beastman()), { status: 200, statusText: 'OK' })
  case 'CULTIST':
    return new NextResponse(ucwords(name_cultist()), { status: 200, statusText: 'OK' })
  case 'TYRANID':
    return new NextResponse(ucwords(name_tyranid()), { status: 200, statusText: 'OK' })
  case 'KROOT':
    return new NextResponse(ucwords(name_kroot()), { status: 200, statusText: 'OK' })
  case 'TAU':
    return new NextResponse(ucwords(name_tau()), { status: 200, statusText: 'OK' })
  default:
    return new NextResponse(nametype, { status: 200, statusText: 'OK' })
  }
}
