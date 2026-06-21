import { getAuthSession } from '@/lib/auth'
import { genId } from '@/lib/utils/utils'
import { KillteamService } from '@/services/killteam.service'
import { OpTypeService } from '@/services/opType.service'
import { WeaponService } from '@/services/weapon.service'
import { NextResponse } from 'next/server'

function validateCreate(body: any) {
  const errors: string[] = []
  const data: any = {}

  data.opTypeId = typeof body.opTypeId === 'string' ? body.opTypeId.trim() : ''
  if (!data.opTypeId) errors.push('opTypeId is required')

  const wepName = typeof body.wepName === 'string' ? body.wepName.trim() : ''
  if (!wepName) errors.push('wepName is required')
  if (wepName.length > 250) errors.push('wepName must be <= 250 chars')
  data.wepName = wepName

  const wepType = typeof body.wepType === 'string' ? body.wepType.trim().toUpperCase() : 'M'
  if (wepType.length !== 1) errors.push('wepType must be a single character')
  data.wepType = wepType

  data.isDefault = typeof body.isDefault === 'boolean' ? body.isDefault : false
  return { errors, data }
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { errors, data } = validateCreate(body)
  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 400 })

  // Validate parent opType and killteam ownership
  const opType = await OpTypeService.getOpTypeRow(data.opTypeId)
  if (!opType) return new NextResponse('OpType not found', { status: 404 })
  const team = await KillteamService.getKillteamRow(opType.killteamId)
  if (!team) return new NextResponse('Killteam not found', { status: 404 })
  if (team.userId !== session.user.userId && session.user.userId !== 'vince') return new NextResponse('Forbidden', { status: 403 })
  if (team.factionId !== 'HBR') return new NextResponse('Forbidden', { status: 403 })
    
  const MAXWEAPONS = 65

  // Cap weapons per opType at 50
  const currentWepCount = await WeaponService.countForOpType(opType.opTypeId)
  if (currentWepCount >= MAXWEAPONS) {
    return NextResponse.json({ error: `This operative already has the maximum of ${MAXWEAPONS} weapons.` }, { status: 400 })
  }

  // Create weapon + default profile
  try {
    const wep = await WeaponService.createWeaponWithDefaultProfile({
      wepId: `${data.opTypeId}-${genId().slice(0,4)}`,
      opTypeId: data.opTypeId,
      wepName: data.wepName,
      wepType: data.wepType,
      isDefault: data.isDefault,
    })
    if (!wep) throw new Error('Create failed')
    return NextResponse.json(wep.toPlain())
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create weapon' }, { status: 500 })
  }
}
