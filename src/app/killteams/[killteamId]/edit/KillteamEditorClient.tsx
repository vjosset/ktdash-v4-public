'use client'

import { KillteamLink, RosterLink } from '@/components/shared/Links'
import PortraitCropper, { getCroppedBlob } from '@/components/shared/PortraitCropper'
import { Button, Checkbox, Input, Label, Modal } from '@/components/ui'
import Markdown from '@/components/ui/Markdown'
import { AbilityPlain, KillteamPlain, OpTypePlain, OptionPlain, RosterPlain, WeaponPlain, WeaponProfilePlain } from '@/types'
import { commands } from '@uiw/react-md-editor'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Area } from 'react-easy-crop'
import { FiChevronDown, FiChevronRight, FiCopy, FiDownload, FiHelpCircle, FiMove, FiPlus, FiTrash } from 'react-icons/fi'
import { toast } from 'sonner'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const MAXOPTYPES = 30
const MAXWEAPONS = 50
const MAXWEAPONPROFILES = 8
const MAX_PORTRAIT_BYTES = 10 * 1024 * 1024 // 10MB

const NAME_TYPES = [
  'AESBAER',
  'CORVIUS',
  'DECAETA',
  'FYHUCHO',
  'BEARAXE',
  'CZIGHEO',
  'STACEY',
  'GEORGE',
  'ADMECH',
  'HIEROTEK',
  'NECRON',
  'KASSOTHOR',
  'ORK',
  'BEASTMAN',
  'CULTIST',
  'TYRANID',
  'KROOT',
  'TAU',
]

type RosterSummary = Pick<RosterPlain, 'rosterId' | 'rosterName'> & {
  createdAt?: string
  updatedAt?: string
}

export default function KillteamEditorClient({killteam}: { killteam: KillteamPlain }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [team, setTeam] = useState<KillteamPlain>(killteam)
  const descTimer = useRef<NodeJS.Timeout | null>(null)
  const compTimer = useRef<NodeJS.Timeout | null>(null)
  const abilityTimers = useRef<Record<string, NodeJS.Timeout | null>>({})
  const optionTimers = useRef<Record<string, NodeJS.Timeout | null>>({})
  const equipmentTimers = useRef<Record<string, NodeJS.Timeout | null>>({})
  const ployTimers = useRef<Record<string, NodeJS.Timeout | null>>({})

  // ===== Tabs (local, no URL changes) =====
  const validTabs = ['general', 'operatives', 'ploys', 'equipments', 'portrait'] as const
  type Tab = typeof validTabs[number]
  const [tab, setTab] = useState<Tab>('general')
  const [selectedOpTypeId, setSelectedOpTypeId] = useState<string>(killteam.opTypes[0]?.opTypeId ?? '')
  const [showWeapons, setShowWeapons] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showAbilities, setShowAbilities] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'optype', op: OpTypePlain }
    | { kind: 'weapon', op: OpTypePlain, wep: WeaponPlain }
    | { kind: 'wepprofile', op: OpTypePlain, wep: WeaponPlain, profile: WeaponProfilePlain }
    | { kind: 'ability', op: OpTypePlain, ab: AbilityPlain }
    | { kind: 'option', op: OpTypePlain, option: OptionPlain }
    | { kind: 'equipment', eq: any }
    | { kind: 'ploy', ploy: any }
    | null
  >(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
  const [showEffectshelp, setShowEffectshelp] = useState(false)
  const [cloningOpTypeId, setCloningOpTypeId] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<1 | 2>(1)
  const [importKillteams, setImportKillteams] = useState<KillteamPlain[]>([])
  const [loadingImportKillteams, setLoadingImportKillteams] = useState(false)
  const [importKillteamFilter, setImportKillteamFilter] = useState('')
  const [importSourceKillteamId, setImportSourceKillteamId] = useState('')
  const [importSourceKillteam, setImportSourceKillteam] = useState<KillteamPlain | null>(null)
  const [loadingImportSource, setLoadingImportSource] = useState(false)
  const [importSourceOpTypeId, setImportSourceOpTypeId] = useState('')
  const [importingOpType, setImportingOpType] = useState(false)
  const dragOpId = useRef<string | null>(null)
  const dragWepId = useRef<string | null>(null)
  const dragProfileId = useRef<string | null>(null)
  const dragPloyId = useRef<string | null>(null)
  const dragEqId = useRef<string | null>(null)
  
  // Stats - display in General tab
  const Stats = dynamic(() => import('@/components/killteam/KillteamStats'), { ssr: false })

  // Portrait state
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeletePortraitConfirm, setShowDeletePortraitConfirm] = useState(false)
  const [portraitBust, setPortraitBust] = useState<number>(0)
  const [hasPortrait, setHasPortrait] = useState<boolean>(false)
  const [publishErrors, setPublishErrors] = useState<string[]>([])
  const [ownedRosters, setOwnedRosters] = useState<RosterSummary[]>([])
  const [loadingRosters, setLoadingRosters] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [savingDefaultRoster, setSavingDefaultRoster] = useState(false)

  const reorderOpTypes = useCallback(async (nextOpTypes: OpTypePlain[]) => {
    // Prepare and send seq updates to server
    const payload = nextOpTypes.map((o, idx) => ({ opTypeId: o.opTypeId, seq: idx + 1 }))
    try {
      await fetch('/api/optypes/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload, normalize: true }),
      })
    } catch (err) {
      console.error('Failed to persist operative order', err)
      toast.error('Failed to save new order')
    }
  }, [])

  const reorderWeapons = useCallback(async (op: OpTypePlain, nextWeapons: WeaponPlain[]) => {
    const payload = nextWeapons.map((w, idx) => ({ wepId: w.wepId, seq: idx + 1 }))
    try {
      await fetch('/api/weapons/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload, normalize: true }),
      })
    } catch (err) {
      console.error('Failed to persist weapon order', err)
      toast.error('Failed to save weapon order')
    }
  }, [])

  const handleDropWeapon = useCallback(async (op: OpTypePlain, targetWepId: string) => {
    const sourceWepId = dragWepId.current
    dragWepId.current = null
    if (!sourceWepId || sourceWepId === targetWepId) return

    const current = op.weapons ?? []
    const fromIndex = current.findIndex(w => w.wepId === sourceWepId)
    const toIndex = current.findIndex(w => w.wepId === targetWepId)
    if (fromIndex === -1 || toIndex === -1) return

    const nextWeapons = current.slice()
    const [moved] = nextWeapons.splice(fromIndex, 1)
    nextWeapons.splice(toIndex, 0, moved)

    // Update local state
    const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, weapons: nextWeapons } : o)
    setTeam({ ...team, opTypes: nextOps })
    await reorderWeapons(op, nextWeapons)
  }, [team, reorderWeapons])

  const reorderPloys = useCallback(async (nextPloys: any[]) => {
    const payload = nextPloys.map((p: any, idx: number) => ({ ployId: p.ployId, seq: idx + 1 }))
    try {
      await fetch('/api/ploys/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload, normalize: true })
      })
    } catch (e) {
      console.error('Failed to reorder ploys', e)
      toast.error('Failed to save ploy order')
    }
  }, [])

  const handleDropPloy = useCallback(async (targetPloyId: string) => {
    const sourceId = dragPloyId.current
    dragPloyId.current = null
    if (!sourceId || sourceId === targetPloyId) return

    const current = team.ploys
    const fromIndex = current.findIndex(p => p.ployId === sourceId)
    const toIndex = current.findIndex(p => p.ployId === targetPloyId)
    if (fromIndex === -1 || toIndex === -1) return

    // Restrict reordering within same ployType to respect server sort
    if (current[fromIndex].ployType !== current[toIndex].ployType) return

    const group = current.filter(p => p.ployType === current[fromIndex].ployType)
    const groupIds = new Set(group.map(g => g.ployId))
    const groupOrdered = current.filter(p => groupIds.has(p.ployId))

    const gFrom = groupOrdered.findIndex(p => p.ployId === sourceId)
    const gTo = groupOrdered.findIndex(p => p.ployId === targetPloyId)
    if (gFrom === -1 || gTo === -1) return

    const nextGroup = groupOrdered.slice()
    const [moved] = nextGroup.splice(gFrom, 1)
    nextGroup.splice(gTo, 0, moved)

    // Stitch back into full list
    const nextAll = current.slice()
    let gi = 0
    for (let i = 0; i < nextAll.length; i++) {
      if (groupIds.has(nextAll[i].ployId)) {
        nextAll[i] = nextGroup[gi++]
      }
    }

    setTeam({ ...team, ploys: nextAll })
    await reorderPloys(nextGroup)
  }, [team, reorderPloys])

  const reorderEquipments = useCallback(async (nextEqs: any[]) => {
    const payload = nextEqs.map((e: any, idx: number) => ({ eqId: e.eqId, seq: idx + 1 }))
    try {
      await fetch('/api/equipments/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload, normalize: true })
      })
    } catch (e) {
      console.error('Failed to reorder equipment', e)
      toast.error('Failed to save equipment order')
    }
  }, [])

  const handleDropEquipment = useCallback(async (targetEqId: string) => {
    const sourceId = dragEqId.current
    dragEqId.current = null
    if (!sourceId || sourceId === targetEqId) return

    const list = team.equipments.filter(eq => eq.killteamId === team.killteamId)
    const fromIndex = list.findIndex(e => e.eqId === sourceId)
    const toIndex = list.findIndex(e => e.eqId === targetEqId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = list.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)

    // Update local state
    const other = team.equipments.filter(eq => eq.killteamId !== team.killteamId)
    setTeam({ ...team, equipments: [...other, ...next] })
    await reorderEquipments(next)
  }, [team, reorderEquipments])

  const reorderProfiles = useCallback(async (w: WeaponPlain, nextProfiles: WeaponProfilePlain[]) => {
    const payload = nextProfiles.map((p, idx) => ({ wepprofileId: p.wepprofileId, seq: idx + 1 }))
    try {
      await fetch('/api/weapon-profiles/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload, normalize: true }),
      })
    } catch (err) {
      console.error('Failed to persist profile order', err)
      toast.error('Failed to save profile order')
    }
  }, [])

  const handleDropProfile = useCallback(async (op: OpTypePlain, w: WeaponPlain, targetProfileId: string) => {
    const sourceId = dragProfileId.current
    dragProfileId.current = null
    if (!sourceId || sourceId === targetProfileId) return

    const current = w.profiles ?? []
    const fromIndex = current.findIndex(p => p.wepprofileId === sourceId)
    const toIndex = current.findIndex(p => p.wepprofileId === targetProfileId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = current.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)

    const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
      ...o,
      weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? { ...ww, profiles: next } : ww)
    } : o)
    setTeam({ ...team, opTypes: nextOps })
    await reorderProfiles(w, next)
  }, [team, reorderProfiles])

  const handleDropOpType = useCallback(async (targetId: string) => {
    const sourceId = dragOpId.current
    dragOpId.current = null
    if (!sourceId || sourceId === targetId) return

    const current = team.opTypes
    const fromIndex = current.findIndex(o => o.opTypeId === sourceId)
    const toIndex = current.findIndex(o => o.opTypeId === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = current.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)

    // Update local order optimistically
    setTeam({ ...team, opTypes: next })
    // Persist new seqs
    await reorderOpTypes(next)
  }, [team, reorderOpTypes])

  const tabClasses = (selected: boolean) =>
    selected
      ? 'px-2 py-2 border-b-2 border-main text-main'
      : 'px-2 py-2 border-b-2 border-transparent text-muted hover:text-foreground'

  const handleTabChange = (newTab: Tab) => setTab(newTab)

  useEffect(() => {
    // Ensure selected opType exists in current team state
    if (!team.opTypes.find(o => o.opTypeId === selectedOpTypeId)) {
      setSelectedOpTypeId(team.opTypes[0]?.opTypeId ?? '')
    }
  }, [team.opTypes, selectedOpTypeId])

  useEffect(() => {
    // Reset collapsibles when switching selected opType
    setShowWeapons(false)
    setShowAbilities(false)
  }, [selectedOpTypeId])

  useEffect(() => {
    if (!team.isHomebrew) {
      setHasPortrait(true)
      return
    }

    let cancelled = false
    const checkPortrait = async () => {
      if (!team.userId) {
        if (!cancelled) setHasPortrait(false)
        return
      }
      try {
        const res = await fetch(`/api/killteams/${team.killteamId}/portrait?thumb=1`, {
          method: 'GET',
          cache: 'no-store',
        })
        if (!cancelled) setHasPortrait(res.ok)
      } catch (err) {
        if (!cancelled) setHasPortrait(false)
      }
    }

    checkPortrait()
    return () => { cancelled = true }
  }, [team.isHomebrew, team.killteamId, team.userId])

  useEffect(() => {
    if (!team.userId) {
      setOwnedRosters([])
      return
    }

    let cancelled = false
    const loadRosters = async () => {
      setLoadingRosters(true)
      setRosterError(null)
      try {
        const res = await fetch(`/api/killteams/${team.killteamId}/rosters`, { cache: 'no-store' })
        if (!res.ok) {
          const message = await res.text().catch(() => '')
          throw new Error(message || 'Failed to load rosters')
        }
        const data = await res.json()
        if (!cancelled) {
          setOwnedRosters(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load rosters', err)
          setRosterError('Could not load your rosters for this killteam.')
          setOwnedRosters([])
        }
      } finally {
        if (!cancelled) setLoadingRosters(false)
      }
    }

    loadRosters()
    return () => { cancelled = true }
  }, [team.killteamId, team.userId])

  const saveField = useCallback(async (patch: Partial<KillteamPlain>) => {
    try {
      const res = await fetch(`/api/killteams/${team.killteamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      const updated: KillteamPlain = await res.json()
      setTeam(updated)
      toast.success('Saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [team.killteamId])

  const validateReadyToPublish = useCallback((draft: KillteamPlain): string[] => {
    if (!draft.isHomebrew) return []

    const issues: string[] = []
    const killteamName = draft.killteamName?.trim() ?? ''

    if (killteamName.includes('WIP')) {
      issues.push('Killteam cannot be a Work in Progress.')
    }
    if (!hasPortrait) {
      issues.push('Add a portrait for this killteam.')
    }

    const opTypes = draft.opTypes ?? []
    if (opTypes.length < 3) {
      issues.push(`Add at least 3 operative types (current count: ${opTypes.length}).`)
    }

    const archetypes = (draft.archetypes || '').split('/').map(a => a.trim()).filter(Boolean)
    if (!archetypes.length) {
      issues.push('Select at least one archetype.')
    }

    const composition = typeof draft.composition === 'string' ? draft.composition.trim() : ''
    if (!composition) {
      issues.push('Add a composition summary for this killteam.')
    }

    const description = typeof draft.description === 'string' ? draft.description.trim() : ''
    if (!description) {
      issues.push('Add a description for this killteam.')
    }

    const missingMelee = opTypes.filter(op => !(op.weapons ?? []).some(weapon => (weapon.wepType ?? '').trim().toUpperCase() === 'M'))
    if (missingMelee.length) {
      const names = missingMelee.map(op => {
        const name = op.opTypeName?.trim()
        return name && name.length ? name : 'Unnamed operative'
      }).join(', ')
      issues.push(`Ensure every operative type has a melee weapon: ${names}.`)
    }

    const forbiddenOpNames = opTypes.filter(op => (op.opTypeName?.trim().toLowerCase() ?? '').includes('new operative'))
    if (forbiddenOpNames.length) {
      const names = forbiddenOpNames.map(op => {
        const name = op.opTypeName?.trim()
        return name && name.length ? name : 'Unnamed operative'
      }).join(', ')
      issues.push(`Rename operative types to remove "new operative": ${names}.`)
    }

    const forbiddenWeapons = opTypes.flatMap(op => {
      const opName = op.opTypeName?.trim()
      const displayOpName = opName && opName.length ? opName : 'Unnamed operative'
      return (op.weapons ?? [])
        .filter(weapon => (weapon.wepName?.trim().toLowerCase() ?? '').includes('new weapon'))
        .map(weapon => {
          const wepName = weapon.wepName?.trim()
          const displayWepName = wepName && wepName.length ? wepName : 'Unnamed weapon'
          return `${displayOpName} → ${displayWepName}`
        })
    })
    if (forbiddenWeapons.length) {
      issues.push(`Rename weapons to remove "new weapon": ${forbiddenWeapons.join(', ')}.`)
    }

    return issues
  }, [hasPortrait])

  useEffect(() => {
    if (!publishErrors.length) return
    const currentIssues = validateReadyToPublish(team)
    if (!currentIssues.length) {
      setPublishErrors([])
      return
    }
    const currentSignature = JSON.stringify(currentIssues)
    const existingSignature = JSON.stringify(publishErrors)
    if (currentSignature !== existingSignature) {
      setPublishErrors(currentIssues)
    }
  }, [publishErrors, team, validateReadyToPublish])

  const handleDefaultRosterChange = useCallback(async (rosterId: string | null) => {
    if (savingDefaultRoster) return
    setSavingDefaultRoster(true)
    try {
      await saveField({ defaultRosterId: rosterId })
    } finally {
      setSavingDefaultRoster(false)
    }
  }, [saveField, savingDefaultRoster])

  const saveOpType = useCallback(async (op: OpTypePlain) => {
    try {
      const res = await fetch(`/api/optypes/${op.opTypeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opTypeName: op.opTypeName,
          MOVE: op.MOVE,
          APL: op.APL,
          SAVE: op.SAVE,
          WOUNDS: op.WOUNDS,
          keywords: op.keywords,
          basesize: op.basesize,
          nameType: op.nameType,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      const updated = await res.json()
      toast.success('Operative type saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const addOpType = useCallback(async (): Promise<OpTypePlain | null> => {
    try {
      const res = await fetch('/api/optypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          killteamId: team.killteamId,
          opTypeName: 'New Operative',
          MOVE: '6"',
          APL: 2,
          SAVE: '4+',
          WOUNDS: 10,
          keywords: '',
          basesize: 32,
          nameType: ''
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created: OpTypePlain = await res.json()
      setTeam({ ...team, opTypes: [...team.opTypes, created] })
      toast.success('Operative type added')
      return created
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
      return null
    }
  }, [team])

  const deleteOpType = useCallback(async (opTypeId: string) => {
    try {
      const res = await fetch(`/api/optypes/${opTypeId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      setTeam({ ...team, opTypes: team.opTypes.filter(o => o.opTypeId !== opTypeId) })
      toast.success('Operative type deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  const cloneOpType = useCallback(async (source: OpTypePlain) => {
    const parseError = async (res: Response, fallback: string) => {
      let message = fallback
      try {
        const data = await res.json()
        if (typeof data?.error === 'string') message = data.error
      } catch (err) {
        console.warn('Failed to parse error response', err)
      }
      throw new Error(message)
    }

    const originalName = source.opTypeName ?? ''
    const baseName = originalName.trim() ? originalName.trim() : 'Operative'
    const cloneName = `${baseName} - Copy`

    setCloningOpTypeId(source.opTypeId)
    try {
      const createRes = await fetch('/api/optypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          killteamId: team.killteamId,
          opTypeName: cloneName,
          MOVE: source.MOVE,
          APL: source.APL,
          SAVE: source.SAVE,
          WOUNDS: source.WOUNDS,
          keywords: source.keywords ?? '',
          basesize: source.basesize ?? 32,
          nameType: source.nameType ?? '',
        })
      })
      if (!createRes.ok) {
        await parseError(createRes, 'Failed to clone operative type')
      }
      const created: OpTypePlain = await createRes.json()

      const clonedWeapons: WeaponPlain[] = []
      for (const weapon of source.weapons ?? []) {
        const weaponRes = await fetch('/api/weapons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opTypeId: created.opTypeId,
            wepName: weapon.wepName,
            wepType: weapon.wepType,
            isDefault: weapon.isDefault,
          })
        })
        if (!weaponRes.ok) {
          await parseError(weaponRes, `Failed to copy weapon "${weapon.wepName}"`)
        }
        let newWeapon: WeaponPlain = await weaponRes.json()
        const srcProfiles = weapon.profiles ?? []
        const createdProfiles = newWeapon.profiles ?? []
        const nextProfiles: WeaponProfilePlain[] = []

        if (srcProfiles.length > 0 && createdProfiles[0]) {
          const first = srcProfiles[0]
          const patchRes = await fetch(`/api/weapon-profiles/${createdProfiles[0].wepprofileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileName: first.profileName,
              ATK: first.ATK,
              HIT: first.HIT,
              DMG: first.DMG,
              WR: first.WR,
            })
          })
          if (!patchRes.ok) {
            await parseError(patchRes, `Failed to copy profile "${first.profileName}"`)
          }
          const patched = await patchRes.json()
          nextProfiles.push(patched)
        } else if (createdProfiles.length > 0) {
          nextProfiles.push(createdProfiles[0])
        }

        const startIndex = srcProfiles.length > 0 ? 1 : 0
        for (let idx = startIndex; idx < srcProfiles.length; idx++) {
          const profile = srcProfiles[idx]
          const profileRes = await fetch('/api/weapon-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wepId: newWeapon.wepId,
              profileName: profile.profileName,
              ATK: profile.ATK,
              HIT: profile.HIT,
              DMG: profile.DMG,
              WR: profile.WR,
            })
          })
          if (!profileRes.ok) {
            await parseError(profileRes, `Failed to copy profile "${profile.profileName}"`)
          }
          const createdProfile = await profileRes.json()
          nextProfiles.push(createdProfile)
        }

        if (nextProfiles.length) {
          newWeapon = { ...newWeapon, profiles: nextProfiles }
        }
        clonedWeapons.push(newWeapon)
      }

      const clonedAbilities: AbilityPlain[] = []
      for (const ability of source.abilities ?? []) {
        const abilityPayload: any = {
          opTypeId: created.opTypeId,
          abilityName: ability.abilityName,
          description: ability.description ?? '',
        }
        if (ability.AP !== undefined && ability.AP !== null) {
          abilityPayload.AP = ability.AP
        }
        const abilityRes = await fetch('/api/abilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(abilityPayload)
        })
        if (!abilityRes.ok) {
          await parseError(abilityRes, `Failed to copy ability "${ability.abilityName}"`)
        }
        const createdAbility: AbilityPlain = await abilityRes.json()
        clonedAbilities.push(createdAbility)
      }

      const clonedOptions: OptionPlain[] = []
      for (const option of source.options ?? []) {
        const optionRes = await fetch('/api/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opTypeId: created.opTypeId,
            optionName: option.optionName,
            description: option.description ?? '',
            effects: option.effects ?? '',
          })
        })
        if (!optionRes.ok) {
          await parseError(optionRes, `Failed to copy option "${option.optionName}"`)
        }
        const createdOption: OptionPlain = await optionRes.json()
        clonedOptions.push(createdOption)
      }

      const clonedOpType: OpTypePlain = {
        ...created,
        opTypeName: cloneName,
        weapons: clonedWeapons,
        abilities: clonedAbilities,
        options: clonedOptions,
      }

      setTeam(prev => ({
        ...prev,
        opTypes: [...prev.opTypes, clonedOpType],
      }))
      setSelectedOpTypeId(clonedOpType.opTypeId)
      toast.success('Operative type cloned')
    } catch (err: any) {
      toast.error(err?.message || 'Clone failed')
    } finally {
      setCloningOpTypeId(null)
    }
  }, [team.killteamId])

  const openImportModal = useCallback(async () => {
    setShowImportModal(true)
    setImportStep(1)
    setImportKillteamFilter('')
    setImportSourceKillteamId('')
    setImportSourceKillteam(null)
    setImportSourceOpTypeId('')
    setLoadingImportKillteams(true)
    try {
      const res = await fetch('/api/killteams?scope=standard')
      const data = await res.json()
      setImportKillteams(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load killteams')
    } finally {
      setLoadingImportKillteams(false)
    }
  }, [])

  const selectImportKillteam = useCallback(async (killteamId: string) => {
    setImportSourceKillteamId(killteamId)
    setImportSourceOpTypeId('')
    setImportStep(2)
    setLoadingImportSource(true)
    try {
      const res = await fetch(`/api/killteams/${killteamId}`)
      const data = await res.json()
      setImportSourceKillteam(data)
    } catch {
      toast.error('Failed to load killteam')
    } finally {
      setLoadingImportSource(false)
    }
  }, [])

  const importOpType = useCallback(async (source: OpTypePlain) => {
    const parseError = async (res: Response, fallback: string) => {
      let message = fallback
      try {
        const data = await res.json()
        if (typeof data?.error === 'string') message = data.error
      } catch { /* ignore */ }
      throw new Error(message)
    }

    setImportingOpType(true)
    try {
      const createRes = await fetch('/api/optypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          killteamId: team.killteamId,
          opTypeName: source.opTypeName,
          MOVE: source.MOVE,
          APL: source.APL,
          SAVE: source.SAVE,
          WOUNDS: source.WOUNDS,
          keywords: source.keywords ?? '',
          basesize: source.basesize ?? 32,
          nameType: source.nameType ?? '',
        })
      })
      if (!createRes.ok) await parseError(createRes, 'Failed to import operative type')
      const created: OpTypePlain = await createRes.json()

      const importedWeapons: WeaponPlain[] = []
      for (const weapon of source.weapons ?? []) {
        const weaponRes = await fetch('/api/weapons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opTypeId: created.opTypeId, wepName: weapon.wepName, wepType: weapon.wepType, isDefault: weapon.isDefault })
        })
        if (!weaponRes.ok) await parseError(weaponRes, `Failed to import weapon "${weapon.wepName}"`)
        let newWeapon: WeaponPlain = await weaponRes.json()
        const srcProfiles = weapon.profiles ?? []
        const createdProfiles = newWeapon.profiles ?? []
        const nextProfiles: WeaponProfilePlain[] = []

        if (srcProfiles.length > 0 && createdProfiles[0]) {
          const first = srcProfiles[0]
          const patchRes = await fetch(`/api/weapon-profiles/${createdProfiles[0].wepprofileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileName: first.profileName, ATK: first.ATK, HIT: first.HIT, DMG: first.DMG, WR: first.WR })
          })
          if (!patchRes.ok) await parseError(patchRes, `Failed to import profile "${first.profileName}"`)
          nextProfiles.push(await patchRes.json())
        } else if (createdProfiles.length > 0) {
          nextProfiles.push(createdProfiles[0])
        }

        const startIndex = srcProfiles.length > 0 ? 1 : 0
        for (let idx = startIndex; idx < srcProfiles.length; idx++) {
          const profile = srcProfiles[idx]
          const profileRes = await fetch('/api/weapon-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wepId: newWeapon.wepId, profileName: profile.profileName, ATK: profile.ATK, HIT: profile.HIT, DMG: profile.DMG, WR: profile.WR })
          })
          if (!profileRes.ok) await parseError(profileRes, `Failed to import profile "${profile.profileName}"`)
          nextProfiles.push(await profileRes.json())
        }

        if (nextProfiles.length) newWeapon = { ...newWeapon, profiles: nextProfiles }
        importedWeapons.push(newWeapon)
      }

      const importedAbilities: AbilityPlain[] = []
      for (const ability of source.abilities ?? []) {
        const payload: any = { opTypeId: created.opTypeId, abilityName: ability.abilityName, description: ability.description ?? '' }
        if (ability.AP !== undefined && ability.AP !== null) payload.AP = ability.AP
        const abilityRes = await fetch('/api/abilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!abilityRes.ok) await parseError(abilityRes, `Failed to import ability "${ability.abilityName}"`)
        importedAbilities.push(await abilityRes.json())
      }

      const importedOptions: OptionPlain[] = []
      for (const option of source.options ?? []) {
        const optionRes = await fetch('/api/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opTypeId: created.opTypeId, optionName: option.optionName, description: option.description ?? '', effects: option.effects ?? '' })
        })
        if (!optionRes.ok) await parseError(optionRes, `Failed to import option "${option.optionName}"`)
        importedOptions.push(await optionRes.json())
      }

      const importedOpType: OpTypePlain = { ...created, weapons: importedWeapons, abilities: importedAbilities, options: importedOptions }
      setTeam(prev => ({ ...prev, opTypes: [...prev.opTypes, importedOpType] }))
      setSelectedOpTypeId(importedOpType.opTypeId)
      setShowImportModal(false)
      toast.success('Operative type imported')
    } catch (err: any) {
      toast.error(err?.message || 'Import failed')
    } finally {
      setImportingOpType(false)
    }
  }, [team.killteamId])

  // ===== Weapons helpers =====
  const addWeapon = useCallback(async (op: OpTypePlain) => {
    try {
      const res = await fetch('/api/weapons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opTypeId: op.opTypeId,
          wepName: 'New Weapon',
          wepType: 'M',
          isDefault: false,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created: WeaponPlain = await res.json()
      const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, weapons: [...(o.weapons ?? []), created] } : o)
      setTeam({ ...team, opTypes: nextOps })
      // Ensure section is visible and scroll to new item
      setShowWeapons(true)
      setTimeout(() => {
        const el = document.getElementById(`wep-${created.wepId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const input = el.querySelector('input') as HTMLInputElement | null
          input?.focus()
        }
      }, 50)
      toast.success('Weapon added')
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
    }
  }, [team])

  const saveWeapon = useCallback(async (wep: WeaponPlain) => {
    try {
      const res = await fetch(`/api/weapons/${wep.wepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wepName: wep.wepName,
          wepType: wep.wepType,
          isDefault: wep.isDefault,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      await res.json()
      toast.success('Weapon saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const deleteWeapon = useCallback(async (op: OpTypePlain, wepId: string) => {
    try {
      const res = await fetch(`/api/weapons/${wepId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      const nextOps = team.opTypes.map(o =>
        o.opTypeId === op.opTypeId ? { ...o, weapons: (o.weapons ?? []).filter(w => w.wepId !== wepId) } : o
      )
      setTeam({ ...team, opTypes: nextOps })
      toast.success('Weapon deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  // ===== Weapon Profile helpers =====
  const addWeaponProfile = useCallback(async (op: OpTypePlain, w: WeaponPlain) => {
    try {
      const res = await fetch('/api/weapon-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wepId: w.wepId,
          profileName: 'Profile',
          ATK: '4', HIT: '4+', DMG: '3/4', WR: ''
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created: WeaponProfilePlain = await res.json()
      const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
        ...o,
        weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? { ...ww, profiles: [ ...(ww.profiles ?? []), created ] } : ww)
      } : o)
      setTeam({ ...team, opTypes: nextOps })
      toast.success('Profile added')
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
    }
  }, [team])

  const saveWeaponProfile = useCallback(async (p: WeaponProfilePlain) => {
    try {
      const res = await fetch(`/api/weapon-profiles/${p.wepprofileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileName: p.profileName,
          ATK: p.ATK,
          HIT: p.HIT,
          DMG: p.DMG,
          WR: p.WR,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      await res.json()
      toast.success('Profile saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const deleteWeaponProfile = useCallback(async (op: OpTypePlain, w: WeaponPlain, wepprofileId: string) => {
    try {
      const res = await fetch(`/api/weapon-profiles/${wepprofileId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
        ...o,
        weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? { ...ww, profiles: (ww.profiles ?? []).filter(pp => pp.wepprofileId !== wepprofileId) } : ww)
      } : o)
      setTeam({ ...team, opTypes: nextOps })
      toast.success('Profile deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  // ===== Abilities helpers =====
  const addAbility = useCallback(async (op: OpTypePlain) => {
    try {
      const res = await fetch('/api/abilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opTypeId: op.opTypeId,
          abilityName: 'New Ability',
          description: '',
          AP: null,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created: AbilityPlain = await res.json()
      const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, abilities: [...(o.abilities ?? []), created] } : o)
      setTeam({ ...team, opTypes: nextOps })
      // Ensure section is visible and scroll to new item
      setShowAbilities(true)
      setTimeout(() => {
        const el = document.getElementById(`ab-${created.abilityId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const input = el.querySelector('input') as HTMLInputElement | null
          input?.focus()
        }
      }, 50)
      toast.success('Ability added')
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
    }
  }, [team])

  const saveAbility = useCallback(async (ab: AbilityPlain) => {
    try {
      const res = await fetch(`/api/abilities/${ab.abilityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abilityName: ab.abilityName,
          description: ab.description,
          AP: ab.AP ?? null,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      await res.json()
      toast.success('Ability saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const deleteAbility = useCallback(async (op: OpTypePlain, abilityId: string) => {
    try {
      const res = await fetch(`/api/abilities/${abilityId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      const nextOps = team.opTypes.map(o =>
        o.opTypeId === op.opTypeId ? { ...o, abilities: (o.abilities ?? []).filter(a => a.abilityId !== abilityId) } : o
      )
      setTeam({ ...team, opTypes: nextOps })
      toast.success('Ability deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  // ===== Options helpers =====
  const addOption = useCallback(async (op: OpTypePlain) => {
    try {
      const res = await fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opTypeId: op.opTypeId,
          optionName: 'New Option',
          description: '',
          effects: '',
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created: OptionPlain = await res.json()
      const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, options: [...(o.options ?? []), created] } : o)
      setTeam({ ...team, opTypes: nextOps })
      setShowOptions(true)
      setTimeout(() => {
        const el = document.getElementById(`opt-${created.optionId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const input = el.querySelector('input') as HTMLInputElement | null
          input?.focus()
        }
      }, 50)
      toast.success('Option added')
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
    }
  }, [team])

  const saveOption = useCallback(async (opt: OptionPlain) => {
    try {
      const res = await fetch(`/api/options/${opt.optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: opt.optionName,
          description: opt.description,
          effects: opt.effects,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      await res.json()
      toast.success('Option saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const deleteOption = useCallback(async (op: OpTypePlain, optionId: string) => {
    try {
      const res = await fetch(`/api/options/${optionId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      const nextOps = team.opTypes.map(o =>
        o.opTypeId === op.opTypeId ? { ...o, options: (o.options ?? []).filter(opt => opt.optionId !== optionId) } : o
      )
      setTeam({ ...team, opTypes: nextOps })
      toast.success('Option deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  // ===== Ploys helpers =====
  const addPloy = useCallback(async () => {
    try {
      const res = await fetch('/api/ploys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          killteamId: team.killteamId,
          ployType: 'S',
          ployName: 'New Ploy',
          description: '',
          effects: ''
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created = await res.json()
      setTeam({ ...team, ploys: [...team.ploys, created] })
      toast.success('Ploy added')
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
    }
  }, [team])

  const savePloy = useCallback(async (ploy: any) => {
    try {
      const res = await fetch(`/api/ploys/${ploy.ployId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ployType: ploy.ployType,
          ployName: ploy.ployName,
          description: ploy.description,
          effects: ploy.effects,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      await res.json()
      toast.success('Ploy saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const deletePloy = useCallback(async (ployId: string) => {
    try {
      const res = await fetch(`/api/ploys/${ployId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      setTeam({ ...team, ploys: team.ploys.filter(p => p.ployId !== ployId) })
      toast.success('Ploy deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  // ===== Equipment helpers =====
  const addEquipment = useCallback(async () => {
    try {
      const res = await fetch('/api/equipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          killteamId: team.killteamId,
          eqName: 'New Equipment',
          description: '',
          effects: ''
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Create failed')
      }
      const created = await res.json()
      setTeam({ ...team, equipments: [...team.equipments, created] })
      toast.success('Equipment added')
    } catch (e: any) {
      toast.error(e?.message || 'Create failed')
    }
  }, [team])

  const saveEquipment = useCallback(async (eq: any) => {
    try {
      const res = await fetch(`/api/equipments/${eq.eqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eqName: eq.eqName,
          description: eq.description,
          effects: eq.effects,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Save failed')
      }
      await res.json()
      toast.success('Equipment saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    }
  }, [])

  const deleteEquipment = useCallback(async (eqId: string) => {
    try {
      const res = await fetch(`/api/equipments/${eqId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Delete failed')
      }
      setTeam({ ...team, equipments: team.equipments.filter(e => e.eqId !== eqId) })
      toast.success('Equipment deleted')
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [team])

  const missingDefaultRoster = !!team.defaultRosterId && !ownedRosters.some(r => r.rosterId === team.defaultRosterId)

  if (error || !killteam) {
    return (
      <div className="px-1 py-8 max-w-7xl mx-auto">
        <p className="text-sm text-destructive">{error ?? 'Killteam not found'}</p>
      </div>
    )
  }

  return (
    <div className="p-2 max-w-7xl mx-auto">
      {/* Preview Button */}
      Preview: <KillteamLink killteam={team} newTab={true} /><br/>
      <em className="text-sm text-muted">Anyone with the link can see this killteam, published or not.</em>

      {/* Tabs */}
      <div className="overflow-x-auto px-2 mt-2">
        <div className="flex justify-center space-x-2 border-b border-border mb-2">
          {([
            { key: 'general', label: 'General' },
            { key: 'operatives', label: 'Operatives' },
            { key: 'ploys', label: 'Ploys' },
            { key: 'equipments', label: 'Equipments' },
            { key: 'portrait', label: 'Portrait' },
          ] as {key: Tab; label: string}[]).map(({ key, label }) => (
            <button
              key={key}
              className={tabClasses(tab === key)}
              onClick={() => handleTabChange(key)}
              aria-current={tab === key ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="mt-4 grid gap-4">
          {/* Stats */}
          {killteam.isPublished && <Stats killteamId={team.killteamId} />}

          {/* Name + Publish in one row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Label htmlFor="ktName" className="whitespace-nowrap">Killteam Name:</Label>
            <Input
              id="ktName"
              value={team.killteamName}
              maxLength={250}
              className="min-w-[220px] flex-1"
              onChange={(e) => setTeam({ ...team, killteamName: e.target.value })}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== killteam.killteamName) saveField({ killteamName: v })
              }}
              placeholder="Enter killteam name"
            />
            <div className="flex items-center gap-2 ml-auto">
              <Checkbox
                id="isPublished"
                checked={!!team.isPublished}
                onChange={(e) => {
                  const checked = (e.target as HTMLInputElement).checked
                  if (checked) {
                  //const issues = validateReadyToPublish({ ...team, isPublished: true })
                  //if (issues.length) {
                  //  setPublishErrors(issues)
                  //  toast.error(['Cannot publish yet:', ...issues.map(issue => `• ${issue}`)].join('\n'))
                  //  return
                  //}
                  //setPublishErrors([])
                  } else {
                    setPublishErrors([])
                  }

                  const next = { ...team, isPublished: checked }
                  setTeam(next)
                  saveField({ isPublished: checked })
                }}
              />
              <Label htmlFor="isPublished" className="whitespace-nowrap">Publish</Label>
            </div>
          </div>

          {publishErrors.length > 0 && (
            <div className="text-sm text-destructive mt-2">
              <ul className="list-disc list-inside space-y-1">
                {publishErrors.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Archetypes in one row */}
          <div className="flex items-center gap-4 flex-wrap">
            <Label className="whitespace-nowrap">Archetypes:</Label>
            <div className="flex items-center gap-4 flex-wrap">
              {['Seek And Destroy', 'Security', 'Recon', 'Infiltration'].map((arch) => {
                const selected = (team.archetypes || '').split('/').map(a => a.trim()).filter(Boolean)
                const isChecked = selected.includes(arch)
                return (
                  <label key={arch} className="inline-flex items-center gap-2">
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = (e.target as HTMLInputElement).checked
                        const baseOrder = ['Seek And Destroy', 'Security', 'Recon', 'Infiltration']
                        const current = new Set((team.archetypes || '').split('/').map(a => a.trim()).filter(Boolean))
                        if (checked) current.add(arch); else current.delete(arch)
                        const next = baseOrder.filter(a => current.has(a)).join('/')
                        const updated = { ...team, archetypes: next }
                        setTeam(updated)
                        saveField({ archetypes: next })
                      }}
                    />
                    <span>{arch}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Default roster controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Default Roster</Label>
              {savingDefaultRoster && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
            </div>
            {loadingRosters ? (
              <div className="text-sm text-muted-foreground">Loading rosters...</div>
            ) : rosterError ? (
              <div className="text-sm text-destructive">{rosterError}</div>
            ) : ownedRosters.length === 0 ? (
              <div className="text-sm text-muted-foreground">Create a roster for this killteam to choose a default.</div>
            ) : (
              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="default-roster"
                    className="h-4 w-4 accent-main"
                    checked={!team.defaultRosterId}
                    onChange={() => handleDefaultRosterChange(null)}
                    disabled={savingDefaultRoster}
                  />
                  <span className="text-sm">No default</span>
                </label>
                {ownedRosters.map((roster) => (
                  <div key={roster.rosterId} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="default-roster"
                      className="h-4 w-4 accent-main"
                      checked={team.defaultRosterId === roster.rosterId}
                      onChange={() => handleDefaultRosterChange(roster.rosterId)}
                      disabled={savingDefaultRoster}
                      aria-label={`Set ${roster.rosterName} as default roster`}
                    />
                    <RosterLink rosterId={roster.rosterId} rosterName={roster.rosterName} newTab />
                  </div>
                ))}
              </div>
            )}
            {missingDefaultRoster && !loadingRosters && !rosterError && (
              <div className="text-sm text-destructive">
              The roster currently set as default is unavailable. Choose a new default or pick 'No default'.
              </div>
            )}
          </div>

          {/* Two-column editors: Description (left) | Composition (right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="ktDescription">Description</Label>
                <a
                  href="https://www.markdownguide.org/basic-syntax/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-main"
                  aria-label="Markdown help"
                >
                  <FiHelpCircle />
                </a>
              </div>
              <div className="custom-md-editor">
                <MDEditor
                  id="ktDescription"
                  value={team.description}
                  onChange={(val) => {
                    const v = val || ''
                    setTeam({ ...team, description: v })
                    if (descTimer.current) clearTimeout(descTimer.current)
                    descTimer.current = setTimeout(() => saveField({ description: v }), 800)
                  }}
                  preview="edit"
                  data-color-mode="dark"
                  style={{ minHeight: 300 }}
                  commands={[
                    commands.bold,
                    commands.italic,
                    commands.hr,
                    commands.divider,
                    commands.quote,
                    commands.unorderedListCommand,
                    commands.orderedListCommand,
                  ]}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="ktComposition">Composition</Label>
                <a
                  href="https://www.markdownguide.org/basic-syntax/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-main"
                  aria-label="Markdown help"
                >
                  <FiHelpCircle />
                </a>
              </div>
              <div className="custom-md-editor">
                <MDEditor
                  id="ktComposition"
                  value={team.composition}
                  onChange={(val) => {
                    const v = val || ''
                    setTeam({ ...team, composition: v })
                    if (compTimer.current) clearTimeout(compTimer.current)
                    compTimer.current = setTimeout(() => saveField({ composition: v }), 800)
                  }}
                  preview="edit"
                  data-color-mode="dark"
                  style={{ minHeight: 300 }}
                  commands={[
                    commands.bold,
                    commands.italic,
                    commands.hr,
                    commands.divider,
                    commands.quote,
                    commands.unorderedListCommand,
                    commands.orderedListCommand,
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Danger Zone: Delete Killteam */}
          <div className="border border-red-700/50 bg-red-900/10 rounded p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h6 className="text-red-600">Danger Zone</h6>
                <p className="text-sm text-muted-foreground mt-1">
                Deleting this homebrew killteam will permanently remove all of its data. This includes all
                operatives, weapons, abilities, ploys, and equipments. Any rosters built using this team — even those
                owned by other users — will be deleted. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-red-600 border border-red-600 hover:text-red-700 hover:border-red-700"
                onClick={() => setShowDeleteTeamModal(true)}
              >
                <FiTrash /> Delete Killteam
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Operatives */}
      {tab === 'operatives' && (
        <div className="mt-2 flex gap-4">
          {/* Left: List of operative types */}
          <div className="w-72 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h5>Operative Types</h5>
              <div className="flex items-center gap-1">
                <button
                  className="text-main disabled:text-muted p-1 border border-main rounded hover:bg-muted/20"
                  onClick={openImportModal}
                  disabled={(team.opTypes?.length ?? 0) >= MAXOPTYPES}
                  title={(team.opTypes?.length ?? 0) >= MAXOPTYPES ? `Maximum of ${MAXOPTYPES} operative types reached` : 'Import from standard killteam'}
                >
                  <FiDownload aria-label="Import Operative Type" />
                </button>
                <button
                  className="text-main disabled:text-muted p-1 border border-main rounded hover:bg-muted/20"
                  onClick={async () => {
                    const created = await addOpType()
                    if (created) setSelectedOpTypeId(created.opTypeId)
                  }}
                  disabled={(team.opTypes?.length ?? 0) >= MAXOPTYPES}
                  title={(team.opTypes?.length ?? 0) >= MAXOPTYPES ? `Maximum of ${MAXOPTYPES} operative types reached` : 'Add Operative Type'}
                >
                  <FiPlus aria-label="Add Operative Type" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {team.opTypes.map((o) => {
                const selected = o.opTypeId === selectedOpTypeId
                return (
                  <button
                    key={o.opTypeId}
                    className={`w-full text-left border rounded px-2 py-2 ${selected ? 'border-main bg-muted/20' : 'border-border hover:border-muted'}`}
                    onClick={() => setSelectedOpTypeId(o.opTypeId)}
                    draggable
                    onDragStart={() => { dragOpId.current = o.opTypeId }}
                    onDragOver={(e) => { e.preventDefault() }}
                    onDrop={() => handleDropOpType(o.opTypeId)}
                    title="Drag to reorder"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-muted-foreground cursor-grab active:cursor-grabbing"
                          aria-label="Drag to reorder"
                          title="Drag to reorder"
                        >
                          <FiMove />
                        </span>
                        <span className="truncate">{o.opTypeName || 'Unnamed'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">W:{o.weapons?.length ?? 0} A:{o.abilities?.length ?? 0}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Details for selected operative type */}
          <div className="flex-1">
            {(() => {
              const op = team.opTypes.find(o => o.opTypeId === selectedOpTypeId)
              if (!op) return (
                <div className="text-muted-foreground">Select an operative type to edit.</div>
              )
              return (
                <div key={op.opTypeId} className="border border-border rounded p-3 bg-card">
                  <h6>General</h6>
                  {/* Main: Name + Stats + Delete */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-12 md:col-span-7">
                      <Label className="whitespace-nowrap">Name</Label>
                      <Input
                        value={op.opTypeName}
                        maxLength={250}
                        onChange={(e) => setTeam({
                          ...team,
                          opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, opTypeName: e.target.value } : o)
                        })}
                        onBlur={() => saveOpType(op)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label>APL</Label>
                          <Input
                            type="number"
                            className="no-spinner"
                            value={op.APL}
                            onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, APL: parseInt(e.target.value || '0', 10) } : o) })}
                            onBlur={() => saveOpType(op)}
                          />
                        </div>
                        <div>
                          <Label>MOVE</Label>
                          <Input
                            value={op.MOVE}
                            maxLength={10}
                            onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, MOVE: e.target.value } : o) })}
                            onBlur={() => saveOpType(op)}
                          />
                        </div>
                        <div>
                          <Label>SAVE</Label>
                          <Input
                            value={op.SAVE}
                            maxLength={10}
                            onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, SAVE: e.target.value } : o) })}
                            onBlur={() => saveOpType(op)}
                          />
                        </div>
                        <div>
                          <Label>WOUNDS</Label>
                          <Input
                            type="number"
                            className="no-spinner"
                            value={op.WOUNDS}
                            onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, WOUNDS: parseInt(e.target.value || '0', 10) } : o) })}
                            onBlur={() => saveOpType(op)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-1 md:text-right self-start">
                      <div className="flex gap-2 justify-start md:justify-end">
                        <button
                          className="text-main whitespace-nowrap p-1 border border-main rounded hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => cloneOpType(op)}
                          title="Clone Operative Type"
                          disabled={cloningOpTypeId === op.opTypeId}
                        >
                          <FiCopy aria-label="Clone" />
                        </button>
                        <button
                          className="text-destructive whitespace-nowrap p-1 border border-main rounded hover:bg-muted/20"
                          onClick={() => setPendingDelete({ kind: 'optype', op })}
                          title="Delete Operative Type"
                          disabled={cloningOpTypeId === op.opTypeId}
                        >
                          <FiTrash aria-label="Delete" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Meta: Keywords + NameType */}
                  <div className="grid grid-cols-12 gap-2 mt-2">
                    <div className="col-span-12 md:col-span-8">
                      <Label>Keywords</Label>
                      <Input
                        value={op.keywords}
                        maxLength={250}
                        onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, keywords: e.target.value } : o) })}
                        onBlur={() => saveOpType(op)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <Label>NameType</Label>
                      <select
                        className="bg-card text-foreground border border-border rounded p-1 my-2 focus:outline-none focus:ring-2 focus:ring-main w-full"
                        value={op.nameType}
                        onChange={(e) => {
                          const v = e.target.value
                          const nextOps = team.opTypes.map(o => o.opTypeId === op.opTypeId ? { ...o, nameType: v } : o)
                          setTeam({ ...team, opTypes: nextOps })
                          // Save immediately on selection
                          saveOpType({ ...op, nameType: v })
                        }}
                      >
                        <option value="">Select…</option>
                        {NAME_TYPES.map(nt => (
                          <option key={nt} value={nt}>{nt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Weapons */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        className="flex items-center gap-2 text-foreground hover:text-main"
                        onClick={() => setShowWeapons(!showWeapons)}
                        aria-expanded={showWeapons}
                        aria-controls="weapons-section"
                      >
                        {showWeapons ? <FiChevronDown /> : <FiChevronRight />}
                        <h6>Weapons</h6>
                        <span className="text-xs bg-muted/20 text-muted-foreground border border-border rounded-full px-2 py-0.5">{op.weapons?.length ?? 0}</span>
                      </button>
                      <button
                        className="text-main disabled:text-muted p-1 border border-main rounded hover:bg-muted/20"
                        onClick={() => addWeapon(op)}
                        disabled={(op.weapons?.length ?? 0) >= MAXWEAPONS}
                        title={(op.weapons?.length ?? 0) >= MAXWEAPONS ? `Maximum of ${MAXWEAPONS} weapons reached` : ''}
                      >
                        <FiPlus aria-label="Add Weapon" />
                      </button>
                    </div>
                    {showWeapons && (
                      <div id="weapons-section" className="space-y-2">
                        {(op.weapons ?? []).map((w) => (
                          <div
                            key={w.wepId}
                            id={`wep-${w.wepId}`}
                            className="border border-border rounded p-2"
                            draggable
                            onDragStart={() => { dragWepId.current = w.wepId }}
                            onDragOver={(e) => { e.preventDefault() }}
                            onDrop={() => handleDropWeapon(op, w.wepId)}
                            title="Drag to reorder"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start">
                              <div className="sm:col-span-2">
                                <Label>Name</Label>
                                <Input
                                  value={w.wepName}
                                  maxLength={250}
                                  onChange={(e) => setTeam({
                                    ...team,
                                    opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                      ...o,
                                      weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? { ...ww, wepName: e.target.value } : ww)
                                    } : o)
                                  })}
                                  onBlur={() => saveWeapon(w)}
                                />
                              </div>
                              <div>
                                <Label>Type</Label>
                                <select
                                  className="bg-card text-foreground border border-border rounded p-1 my-2 focus:outline-none focus:ring-2 focus:ring-main w-full"
                                  value={w.wepType}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setTeam({
                                      ...team,
                                      opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                        ...o,
                                        weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? { ...ww, wepType: v } : ww)
                                      } : o)
                                    })
                                    saveWeapon({ ...w, wepType: v })
                                  }}
                                >
                                  {['M','R','E','P'].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={w.isDefault}
                                  onChange={(e) => {
                                    const checked = (e.target as HTMLInputElement).checked
                                    setTeam({
                                      ...team,
                                      opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                        ...o,
                                        weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? { ...ww, isDefault: checked } : ww)
                                      } : o)
                                    })
                                    saveWeapon({ ...w, isDefault: checked })
                                  }}
                                />
                                <Label className="whitespace-nowrap">Default</Label>
                              </div>
                              <div className="flex items-start justify-end gap-2 sm:col-span-1">
                                <button
                                  className="p-1 border border-main rounded hover:bg-muted/20"
                                  aria-label="Drag to reorder"
                                  title="Drag to reorder"
                                  onMouseDown={(e) => { /* purely visual, drag is on card */ }}
                                >
                                  <FiMove />
                                </button>
                                <button
                                  className="text-destructive p-1 border border-main rounded hover:bg-muted/20"
                                  title="Delete Weapon"
                                  onClick={() => setPendingDelete({ kind: 'weapon', op, wep: w })}
                                >
                                  <FiTrash aria-label="Delete Weapon" />
                                </button>
                              </div>
                            </div>
                            {/* Profiles */}
                            <div className="mt-2">
                              <div className="space-y-1">
                                {/* Column headers for profiles with add button on the same line */}
                                <div className="hidden sm:grid grid-cols-8 gap-1 items-center text-muted-foreground">
                                  <div className="col-span-2"><Label className="m-0">Profile</Label></div>
                                  <div><Label className="m-0">ATK</Label></div>
                                  <div><Label className="m-0">HIT</Label></div>
                                  <div><Label className="m-0">DMG</Label></div>
                                  <div className="col-span-2"><Label className="m-0">WR</Label></div>
                                  <div className="flex justify-end">
                                    <button
                                      className="text-main disabled:text-muted p-1 border border-main rounded hover:bg-muted/20"
                                      onClick={() => addWeaponProfile(op, w)}
                                      disabled={(w.profiles?.length ?? 0) >= MAXWEAPONPROFILES}
                                      title={(w.profiles?.length ?? 0) >= MAXWEAPONPROFILES ? `Maximum of ${MAXWEAPONPROFILES} profiles reached` : ''}
                                    >
                                      <FiPlus aria-label="Add Profile" />
                                    </button>
                                  </div>
                                </div>

                                {(w.profiles ?? []).map((p) => (
                                  <div
                                    key={p.wepprofileId}
                                    className="grid grid-cols-1 sm:grid-cols-8 gap-1 sm:items-center items-start"
                                    draggable
                                    onDragStart={() => { dragProfileId.current = p.wepprofileId }}
                                    onDragOver={(e) => { e.preventDefault() }}
                                    onDrop={() => handleDropProfile(op, w, p.wepprofileId)}
                                    title="Drag to reorder"
                                  >
                                    <div className="sm:col-span-2">
                                      <Label className="mb-1 sm:hidden">Profile</Label>
                                      <Input
                                        className="my-0"
                                        value={p.profileName}
                                        maxLength={250}
                                        onChange={(e) => setTeam({
                                          ...team,
                                          opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                            ...o,
                                            weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? {
                                              ...ww,
                                              profiles: (ww.profiles ?? []).map(pp => pp.wepprofileId === p.wepprofileId ? { ...pp, profileName: e.target.value } : pp)
                                            } : ww)
                                          } : o)
                                        })}
                                        onBlur={() => saveWeaponProfile(p)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="mb-1 sm:hidden">ATK</Label>
                                      <Input
                                        className="w-16 my-0"
                                        value={p.ATK}
                                        maxLength={10}
                                        onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                          ...o,
                                          weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? {
                                            ...ww,
                                            profiles: (ww.profiles ?? []).map(pp => pp.wepprofileId === p.wepprofileId ? { ...pp, ATK: e.target.value } : pp)
                                          } : ww)
                                        } : o) })}
                                        onBlur={() => saveWeaponProfile(p)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="mb-1 sm:hidden">HIT</Label>
                                      <Input
                                        className="w-16 my-0"
                                        value={p.HIT}
                                        maxLength={10}
                                        onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                          ...o,
                                          weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? {
                                            ...ww,
                                            profiles: (ww.profiles ?? []).map(pp => pp.wepprofileId === p.wepprofileId ? { ...pp, HIT: e.target.value } : pp)
                                          } : ww)
                                        } : o) })}
                                        onBlur={() => saveWeaponProfile(p)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="mb-1 sm:hidden">DMG</Label>
                                      <Input
                                        className="w-16 my-0"
                                        value={p.DMG}
                                        maxLength={10}
                                        onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                          ...o,
                                          weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? {
                                            ...ww,
                                            profiles: (ww.profiles ?? []).map(pp => pp.wepprofileId === p.wepprofileId ? { ...pp, DMG: e.target.value } : pp)
                                          } : ww)
                                        } : o) })}
                                        onBlur={() => saveWeaponProfile(p)}
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label className="mb-1 sm:hidden">WR</Label>
                                      <Input
                                        className="my-0"
                                        value={p.WR}
                                        maxLength={250}
                                        onChange={(e) => setTeam({ ...team, opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                          ...o,
                                          weapons: (o.weapons ?? []).map(ww => ww.wepId === w.wepId ? {
                                            ...ww,
                                            profiles: (ww.profiles ?? []).map(pp => pp.wepprofileId === p.wepprofileId ? { ...pp, WR: e.target.value } : pp)
                                          } : ww)
                                        } : o) })}
                                        onBlur={() => saveWeaponProfile(p)}
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        className="p-1 border border-main rounded hover:bg-muted/20"
                                        aria-label="Drag to reorder"
                                        title="Drag to reorder"
                                        onMouseDown={() => { /* visual only, drag is on row */ }}
                                      >
                                        <FiMove />
                                      </button>
                                      <button
                                        className="text-destructive p-1 border border-main rounded hover:bg-muted/20"
                                        disabled={(w.profiles?.length ?? 0) <= 1}
                                        title={(w.profiles?.length ?? 0) <= 1 ? 'Weapon must have at least one profile' : 'Delete Profile'}
                                        onClick={() => setPendingDelete({ kind: 'wepprofile', op, wep: w, profile: p })}
                                      >
                                        <FiTrash aria-label="Delete Profile" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Abilities */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        className="flex items-center gap-2 text-foreground hover:text-main"
                        onClick={() => setShowAbilities(!showAbilities)}
                        aria-expanded={showAbilities}
                        aria-controls="abilities-section"
                      >
                        {showAbilities ? <FiChevronDown /> : <FiChevronRight />}
                        <h6>Abilities</h6>
                        <span className="text-xs bg-muted/20 text-muted-foreground border border-border rounded-full px-2 py-0.5">{op.abilities?.length ?? 0}</span>
                      </button>
                      <button
                        className="text-main p-1 border border-main rounded hover:bg-muted/20"
                        onClick={() => addAbility(op)}
                      >
                        <FiPlus aria-label="Add Ability" />
                      </button>
                    </div>
                    {showAbilities && (
                      <div id="abilities-section" className="space-y-2">
                        {(op.abilities ?? []).map((ab) => (
                          <div key={ab.abilityId} id={`ab-${ab.abilityId}`} className="border border-border rounded p-2">
                            {/* Top row: Name, AP, Delete */}
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start">
                              <div className="sm:col-span-3">
                                <Label>Name</Label>
                                <Input
                                  value={ab.abilityName}
                                  maxLength={250}
                                  onChange={(e) => setTeam({
                                    ...team,
                                    opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                      ...o,
                                      abilities: (o.abilities ?? []).map(a => a.abilityId === ab.abilityId ? { ...a, abilityName: e.target.value } : a)
                                    } : o)
                                  })}
                                  onBlur={() => saveAbility(ab)}
                                />
                              </div>
                              <div>
                                <Label>AP</Label>
                                <Input
                                  type="number"
                                  value={ab.AP ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const num = val === '' ? NaN : Number(val)
                                    setTeam({
                                      ...team,
                                      opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                        ...o,
                                        abilities: (o.abilities ?? []).map(a => a.abilityId === ab.abilityId ? { ...a, AP: (val === '' || Number.isNaN(num)) ? undefined : num } : a)
                                      } : o)
                                    })
                                  }}
                                  onBlur={() => saveAbility(ab)}
                                />
                              </div>
                              <div className="text-right sm:col-span-1 sm:self-start pt-1">
                                <button
                                  className="text-destructive p-1 border border-main rounded hover:bg-muted/20"
                                  title="Delete Ability"
                                  onClick={() => setPendingDelete({ kind: 'ability', op, ab })}
                                >
                                  <FiTrash aria-label="Delete Ability" />
                                </button>
                              </div>
                            </div>

                            {/* Bottom row: Description editor full width */}
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Label>Description</Label>
                                <a
                                  href="https://www.markdownguide.org/basic-syntax/"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted-foreground hover:text-main"
                                  aria-label="Markdown help"
                                >
                                  <FiHelpCircle />
                                </a>
                              </div>
                              <div className="custom-md-editor">
                                <MDEditor
                                  value={ab.description}
                                  onChange={(val) => {
                                    const v = val || ''
                                    setTeam({
                                      ...team,
                                      opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                        ...o,
                                        abilities: (o.abilities ?? []).map(a => a.abilityId === ab.abilityId ? { ...a, description: v } : a)
                                      } : o)
                                    })
                                    // debounce save per-ability
                                    const id = ab.abilityId
                                    if (abilityTimers.current[id]) clearTimeout(abilityTimers.current[id]!)
                                    abilityTimers.current[id] = setTimeout(() => saveAbility({ ...ab, description: v }), 800)
                                  }}
                                  preview="edit"
                                  data-color-mode="dark"
                                  style={{ minHeight: 120 }}
                                  commands={[
                                    commands.bold,
                                    commands.italic,
                                    commands.hr,
                                    commands.divider,
                                    commands.quote,
                                    commands.unorderedListCommand,
                                    commands.orderedListCommand,
                                    commands.table,
                                  ]}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        className="flex items-center gap-2 text-foreground hover:text-main"
                        onClick={() => setShowOptions(!showOptions)}
                        aria-expanded={showOptions}
                        aria-controls="options-section"
                      >
                        {showOptions ? <FiChevronDown /> : <FiChevronRight />}
                        <h6>Options</h6>
                        <span className="text-xs bg-muted/20 text-muted-foreground border border-border rounded-full px-2 py-0.5">{op.options?.length ?? 0}</span>
                      </button>
                      <button
                        className="text-main p-1 border border-main rounded hover:bg-muted/20"
                        onClick={() => addOption(op)}
                      >
                        <FiPlus aria-label="Add Option" />
                      </button>
                    </div>
                    {showOptions && (
                      <div id="options-section" className="space-y-2">
                        {(op.options ?? []).map((opt) => (
                          <div key={opt.optionId} id={`opt-${opt.optionId}`} className="border border-border rounded p-2">
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-start">
                              <div className="sm:col-span-3">
                                <Label>Name</Label>
                                <Input
                                  value={opt.optionName}
                                  maxLength={50}
                                  onChange={(e) => setTeam({
                                    ...team,
                                    opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                      ...o,
                                      options: (o.options ?? []).map(oo => oo.optionId === opt.optionId ? { ...oo, optionName: e.target.value } : oo)
                                    } : o)
                                  })}
                                  onBlur={() => saveOption(opt)}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <div className="flex items-center justify-between">
                                  <Label className="m-0">Effects</Label>
                                  <button
                                    type="button"
                                    className="text-muted hover:text-foreground p-1"
                                    title="Effects help"
                                    onClick={() => setShowEffectshelp(true)}
                                    aria-label="Open effects help"
                                  >
                                    <FiHelpCircle />
                                  </button>
                                </div>
                                <Input
                                  className="mt-0 mb-0"
                                  value={opt.effects || ''}
                                  maxLength={50}
                                  onChange={(e) => setTeam({
                                    ...team,
                                    opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                      ...o,
                                      options: (o.options ?? []).map(oo => oo.optionId === opt.optionId ? { ...oo, effects: e.target.value } : oo)
                                    } : o)
                                  })}
                                  onBlur={() => saveOption(opt)}
                                />
                              </div>
                              <div className="text-right sm:self-start pt-1">
                                <button
                                  className="text-destructive p-1 border border-main rounded hover:bg-muted/20"
                                  title="Delete Option"
                                  onClick={() => setPendingDelete({ kind: 'option', op, option: opt })}
                                >
                                  <FiTrash aria-label="Delete Option" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Label>Description</Label>
                                <a
                                  href="https://www.markdownguide.org/basic-syntax/"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted-foreground hover:text-main"
                                  aria-label="Markdown help"
                                >
                                  <FiHelpCircle />
                                </a>
                              </div>
                              <div className="custom-md-editor">
                                <MDEditor
                                  value={opt.description || ''}
                                  onChange={(val) => {
                                    const v = val || ''
                                    setTeam({
                                      ...team,
                                      opTypes: team.opTypes.map(o => o.opTypeId === op.opTypeId ? {
                                        ...o,
                                        options: (o.options ?? []).map(oo => oo.optionId === opt.optionId ? { ...oo, description: v } : oo)
                                      } : o)
                                    })
                                    const id = opt.optionId
                                    if (optionTimers.current[id]) clearTimeout(optionTimers.current[id]!)
                                    optionTimers.current[id] = setTimeout(() => saveOption({ ...opt, description: v }), 800)
                                  }}
                                  preview="edit"
                                  data-color-mode="dark"
                                  style={{ minHeight: 120 }}
                                  commands={[
                                    commands.bold,
                                    commands.italic,
                                    commands.hr,
                                    commands.divider,
                                    commands.quote,
                                    commands.unorderedListCommand,
                                    commands.orderedListCommand,
                                    commands.table,
                                  ]}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Portrait */}
      {tab === 'portrait' && (
        <div className="mt-4 flex flex-col gap-4">

          {/* Current portrait */}
          {hasPortrait && !rawImageSrc && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5>Current Portrait</h5>
                <Button
                  variant="ghost"
                  className="text-destructive border-destructive hover:text-destructive"
                  onClick={() => setShowDeletePortraitConfirm(true)}
                  disabled={isSaving}
                >
                  <h6>Delete</h6>
                </Button>
              </div>
              <img
                src={`/api/killteams/${team.killteamId}/portrait${portraitBust ? `?ts=${portraitBust}` : ''}`}
                alt="Killteam portrait"
                className="rounded border border-border w-full object-cover"
                style={{ aspectRatio: '3/2', maxWidth: 400 }}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Upload / cropper */}
          <div>
            <h5>{hasPortrait ? 'Replace Portrait' : 'Upload Portrait'}</h5>

            {rawImageSrc ? (
              <div className="mt-2 flex flex-col gap-2">
                <PortraitCropper
                  imageSrc={rawImageSrc}
                  onCropComplete={setCroppedAreaPixels}
                />
                <div className="flex items-center justify-between">
                  <button
                    className="text-xs text-muted underline"
                    onClick={() => { setRawImageSrc(null); setCroppedAreaPixels(null) }}
                  >
                    Choose different image
                  </button>
                  {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!croppedAreaPixels || isSaving}
                    onClick={async () => {
                      if (!rawImageSrc || !croppedAreaPixels) return
                      setIsSaving(true)
                      setUploadError(null)
                      try {
                        const blob = await getCroppedBlob(rawImageSrc, croppedAreaPixels)
                        const form = new FormData()
                        form.append('image', blob, 'portrait.jpg')
                        const res = await fetch(`/api/killteams/${team.killteamId}/portrait`, { method: 'POST', body: form })
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({} as any))
                          throw new Error(err?.error || 'Upload failed')
                        }
                        toast.success('Portrait uploaded')
                        setRawImageSrc(null)
                        setCroppedAreaPixels(null)
                        setHasPortrait(true)
                        setPortraitBust(Date.now())
                      } catch (e: any) {
                        setUploadError(e?.message || 'Upload failed')
                      } finally {
                        setIsSaving(false)
                      }
                    }}
                  >
                    <h6>{isSaving ? 'Saving…' : 'Upload'}</h6>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setUploadError(null)
                    if (!f) return
                    if (f.size > MAX_PORTRAIT_BYTES) {
                      setUploadError('File too large. Max size is 10MB.')
                      return
                    }
                    setRawImageSrc(URL.createObjectURL(f))
                    setCroppedAreaPixels(null)
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-muted mt-2">WebP will be generated at 900x600 and 225x150 (thumbnail).</p>
                {uploadError && <p className="text-destructive text-sm mt-2">{uploadError}</p>}
              </>
            )}
          </div>

          {showDeletePortraitConfirm && (
            <Modal
              title="Delete Killteam Portrait"
              onClose={() => setShowDeletePortraitConfirm(false)}
              footer={
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowDeletePortraitConfirm(false)}>
                    <h6>Cancel</h6>
                  </Button>
                  <Button
                    onClick={async () => {
                      setShowDeletePortraitConfirm(false)
                      setIsSaving(true)
                      try {
                        const res = await fetch(`/api/killteams/${team.killteamId}/portrait`, { method: 'DELETE' })
                        if (!res.ok && res.status !== 204) {
                          const err = await res.json().catch(() => ({} as any))
                          throw new Error(err?.error || 'Delete failed')
                        }
                        toast.success('Portrait deleted')
                        setHasPortrait(false)
                        setPortraitBust(Date.now())
                      } catch (e: any) {
                        toast.error(e?.message || 'Delete failed')
                      } finally {
                        setIsSaving(false)
                      }
                    }}
                  >
                    <h6>Delete</h6>
                  </Button>
                </div>
              }
            >
              Are you sure you want to delete this killteam's portrait? This action cannot be undone.
            </Modal>
          )}
        </div>
      )}
      
      {/* Equipments */}
      {tab === 'equipments' && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h5>Equipment</h5>
            <button className="text-main p-1 border border-main rounded hover:bg-muted/20" onClick={addEquipment} title="Add Equipment">
              <FiPlus aria-label="Add Equipment" />
            </button>
          </div>
          <div className="space-y-3">
            {team.equipments.filter(eq => eq.killteamId === team.killteamId).map((eq) => (
              <div
                key={eq.eqId}
                className="border border-border rounded p-3 bg-card"
                draggable
                onDragStart={() => { dragEqId.current = eq.eqId }}
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={() => handleDropEquipment(eq.eqId)}
                title="Drag to reorder"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={eq.eqName}
                      maxLength={250}
                      onChange={(e) => setTeam({ ...team, equipments: team.equipments.map(x => x.eqId === eq.eqId ? { ...x, eqName: e.target.value } : x) })}
                      onBlur={() => saveEquipment(eq)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="m-0">Effects</Label>
                      <button
                        type="button"
                        className="text-muted hover:text-foreground p-1"
                        title="Effects help"
                        onClick={() => setShowEffectshelp(true)}
                        aria-label="Open effects help"
                      >
                        <FiHelpCircle />
                      </button>
                    </div>
                    <Input
                      className="mt-0 mb-0"
                      value={eq.effects || ''}
                      maxLength={250}
                      onChange={(e) => setTeam({ ...team, equipments: team.equipments.map(x => x.eqId === eq.eqId ? { ...x, effects: e.target.value } : x) })}
                      onBlur={() => saveEquipment(eq)}
                    />
                  </div>
                  <div className="text-right md:self-start pt-1 flex justify-end gap-2">
                    <button
                      className="p-1 border border-main rounded hover:bg-muted/20"
                      aria-label="Drag to reorder"
                      title="Drag to reorder"
                    >
                      <FiMove />
                    </button>
                    <button className="text-destructive p-1 border border-main rounded hover:bg-muted/20" title="Delete Equipment" onClick={() => setPendingDelete({ kind: 'equipment', eq })}>
                      <FiTrash aria-label="Delete Equipment" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <Label>Description</Label>
                    <a
                      href="https://www.markdownguide.org/basic-syntax/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-main"
                      aria-label="Markdown help"
                    >
                      <FiHelpCircle />
                    </a>
                  </div>
                  <div className="custom-md-editor">
                    <MDEditor
                      value={eq.description || ''}
                      onChange={(val) => {
                        const v = val || ''
                        setTeam({
                          ...team,
                          equipments: team.equipments.map(x => x.eqId === eq.eqId ? { ...x, description: v } : x)
                        })
                        const id = eq.eqId
                        if (equipmentTimers.current[id]) clearTimeout(equipmentTimers.current[id]!)
                        equipmentTimers.current[id] = setTimeout(() => saveEquipment({ ...eq, description: v }), 800)
                      }}
                      preview="edit"
                      data-color-mode="dark"
                      style={{ minHeight: 120 }}
                      commands={[
                        commands.bold,
                        commands.italic,
                        commands.hr,
                        commands.divider,
                        commands.quote,
                        commands.unorderedListCommand,
                        commands.orderedListCommand,
                        commands.table,
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ploys */}
      {tab === 'ploys' && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h5>Ploys</h5>
            <button className="text-main p-1 border border-main rounded hover:bg-muted/20" onClick={addPloy} title="Add Ploy">
              <FiPlus aria-label="Add Ploy" />
            </button>
          </div>
          <div className="space-y-3">
            {team.ploys.map((p) => (
              <div
                key={p.ployId}
                className="border border-border rounded p-3 bg-card"
                draggable
                onDragStart={() => { dragPloyId.current = p.ployId }}
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={() => handleDropPloy(p.ployId)}
                title="Drag to reorder"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                  <div>
                    <Label>Type</Label>
                    <select
                      className="bg-card text-foreground border border-border rounded p-1 my-2 focus:outline-none focus:ring-2 focus:ring-main w-full"
                      value={p.ployType}
                      onChange={(e) => {
                        const v = e.target.value
                        setTeam({ ...team, ploys: team.ploys.map(x => x.ployId === p.ployId ? { ...x, ployType: v } : x) })
                        savePloy({ ...p, ployType: v })
                      }}
                    >
                      <option value="S">Strategy</option>
                      <option value="F">Firefight</option>
                    </select>
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={p.ployName}
                      maxLength={250}
                      onChange={(e) => setTeam({ ...team, ploys: team.ploys.map(x => x.ployId === p.ployId ? { ...x, ployName: e.target.value } : x) })}
                      onBlur={() => savePloy(p)}
                    />
                  </div>
                  <div className="text-right md:self-start pt-1 flex justify-end gap-2">
                    <button
                      className="p-1 border border-main rounded hover:bg-muted/20"
                      aria-label="Drag to reorder"
                      title="Drag to reorder"
                    >
                      <FiMove />
                    </button>
                    <button className="text-destructive p-1 border border-main rounded hover:bg-muted/20" title="Delete Ploy" onClick={() => setPendingDelete({ kind: 'ploy', ploy: p })}>
                      <FiTrash aria-label="Delete Ploy" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <Label>Description</Label>
                    <a
                      href="https://www.markdownguide.org/basic-syntax/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-main"
                      aria-label="Markdown help"
                    >
                      <FiHelpCircle />
                    </a>
                  </div>
                  <div className="custom-md-editor">
                    <MDEditor
                      value={p.description || ''}
                      onChange={(val) => {
                        const v = val || ''
                        setTeam({
                          ...team,
                          ploys: team.ploys.map(x => x.ployId === p.ployId ? { ...x, description: v } : x)
                        })
                        const id = p.ployId
                        if (ployTimers.current[id]) clearTimeout(ployTimers.current[id]!)
                        ployTimers.current[id] = setTimeout(() => savePloy({ ...p, description: v }), 800)
                      }}
                      preview="edit"
                      data-color-mode="dark"
                      style={{ minHeight: 120 }}
                      commands={[
                        commands.bold,
                        commands.italic,
                        commands.hr,
                        commands.divider,
                        commands.quote,
                        commands.unorderedListCommand,
                        commands.orderedListCommand,
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for sub-items */}
      {pendingDelete && (
        <Modal
          title={
            pendingDelete.kind === 'optype' ? `Delete ${pendingDelete.op.opTypeName}` :
              pendingDelete.kind === 'weapon' ? `Delete ${pendingDelete.wep.wepName}` :
                pendingDelete.kind === 'wepprofile' ? `Delete profile ${pendingDelete.profile.profileName}` :
                  pendingDelete.kind === 'ability' ? `Delete ${pendingDelete.ab.abilityName}` :
                    pendingDelete.kind === 'option' ? `Delete ${pendingDelete.option.optionName}` :
                      pendingDelete.kind === 'equipment' ? `Delete ${pendingDelete.eq.eqName}` :
                        pendingDelete.kind === 'ploy' ? `Delete ${pendingDelete.ploy.ployName}` :
                          'Delete'
          }
          onClose={() => { if (!deleting) setPendingDelete(null) }}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
                <h6>Cancel</h6>
              </Button>
              <Button
                onClick={async () => {
                  if (!pendingDelete) return
                  setDeleting(true)
                  setDeleteError('')
                  try {
                    switch (pendingDelete.kind) {
                    case 'optype': {
                      const remaining = team.opTypes.filter(o => o.opTypeId !== pendingDelete.op.opTypeId)
                      await deleteOpType(pendingDelete.op.opTypeId)
                      setSelectedOpTypeId(remaining[0]?.opTypeId ?? '')
                      break
                    }
                    case 'weapon': {
                      await deleteWeapon(pendingDelete.op, pendingDelete.wep.wepId)
                      break
                    }
                    case 'wepprofile': {
                      await deleteWeaponProfile(pendingDelete.op, pendingDelete.wep, pendingDelete.profile.wepprofileId)
                      break
                    }
                    case 'ability': {
                      await deleteAbility(pendingDelete.op, pendingDelete.ab.abilityId)
                      break
                    }
                    case 'option': {
                      await deleteOption(pendingDelete.op, pendingDelete.option.optionId)
                      break
                    }
                    case 'equipment': {
                      await deleteEquipment(pendingDelete.eq.eqId)
                      break
                    }
                    case 'ploy': {
                      await deletePloy(pendingDelete.ploy.ployId)
                      break
                    }
                    }
                    setPendingDelete(null)
                  } catch (err: any) {
                    setDeleteError(err?.message || 'Delete failed')
                  } finally {
                    setDeleting(false)
                  }
                }}
                disabled={deleting}
              >
                <h6>{deleting ? 'Deleting…' : 'Delete'}</h6>
              </Button>
            </div>
          }
        >
          <p className="text-sm text-foreground">
            Are you sure you want to delete this {pendingDelete.kind}? This cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
        </Modal>
      )}

      {/* Delete Killteam Modal */}
      {showDeleteTeamModal && (
        <Modal
          title={'Delete Homebrew Killteam'}
          onClose={() => { if (!deleting) setShowDeleteTeamModal(false) }}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteTeamModal(false)} disabled={deleting}>
                <h6>Cancel</h6>
              </Button>
              <Button
                variant="ghost"
                className="text-white bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError('')
                  try {
                    const res = await fetch(`/api/killteams/${team.killteamId}`, { method: 'DELETE' })
                    if (!res.ok) {
                      const msg = await res.text().catch(() => '')
                      throw new Error(msg || 'Delete failed')
                    }
                    toast.success('Killteam deleted')
                    setShowDeleteTeamModal(false)
                    const dest = team.user?.userName ? `/users/${team.user.userName}` : '/'
                    router.push(dest)
                  } catch (err: any) {
                    setDeleteError(err?.message || 'Delete failed')
                    toast.error('Could not delete killteam')
                  } finally {
                    setDeleting(false)
                  }
                }}
                disabled={deleting}
              >
                <h6>{deleting ? 'Deleting…' : 'Delete Forever'}</h6>
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-red-600 font-semibold">
              Warning: This will permanently delete this homebrew team and all associated data.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>All operatives, weapons, abilities, ploys, and equipments will be removed.</li>
              <li>All rosters using this team will be deleted, including those owned by other users.</li>
              <li>This action is irreversible. There is no recovery.</li>
            </ul>
            {deleteError && (
              <div className="text-red-500 text-sm">{deleteError}</div>
            )}
          </div>
        </Modal>
      )}

      {/* Import OpType Modal */}
      {showImportModal && (
        <Modal
          title="Import Operative Type"
          onClose={() => { if (!importingOpType) setShowImportModal(false) }}
          footer={
            <div className="flex justify-between gap-2">
              <div>
                {importStep === 2 && (
                  <Button variant="ghost" onClick={() => { setImportStep(1); setImportSourceKillteam(null); setImportSourceOpTypeId('') }} disabled={importingOpType}>
                    <h6>Back</h6>
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowImportModal(false)} disabled={importingOpType}>
                  <h6>Cancel</h6>
                </Button>
                {importStep === 2 && (
                  <Button
                    onClick={() => {
                      const source = importSourceKillteam?.opTypes?.find(o => o.opTypeId === importSourceOpTypeId)
                      if (source) importOpType(source)
                    }}
                    disabled={!importSourceOpTypeId || importingOpType}
                  >
                    <h6>{importingOpType ? 'Importing…' : 'Import'}</h6>
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {importStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select a standard killteam to import an operative type from.</p>
              <Input
                placeholder="Search killteams…"
                value={importKillteamFilter}
                onChange={(e) => setImportKillteamFilter(e.target.value)}
              />
              {loadingImportKillteams ? (
                <div className="text-sm text-muted-foreground">Loading killteams…</div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {importKillteams
                    .filter(kt => kt.killteamId.toLowerCase().includes(importKillteamFilter.toLowerCase()) || kt.killteamName.toLowerCase().includes(importKillteamFilter.toLowerCase()))
                    .map(kt => (
                      <button
                        key={kt.killteamId}
                        className="w-full text-left px-2 py-2 border border-border rounded hover:border-main hover:bg-muted/20"
                        onClick={() => selectImportKillteam(kt.killteamId)}
                      >
                        {kt.killteamName}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
          )}
          {importStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select an operative type from <strong>{importSourceKillteam?.killteamName ?? importSourceKillteamId}</strong>.
              </p>
              {loadingImportSource ? (
                <div className="text-sm text-muted-foreground">Loading operative types…</div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {(importSourceKillteam?.opTypes ?? []).map(op => (
                    <button
                      key={op.opTypeId}
                      className={`w-full text-left px-2 py-2 border rounded hover:border-main hover:bg-muted/20 ${importSourceOpTypeId === op.opTypeId ? 'border-main bg-muted/20' : 'border-border'}`}
                      onClick={() => setImportSourceOpTypeId(op.opTypeId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{op.opTypeName}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">M:{op.MOVE} APL:{op.APL} SV:{op.SAVE} W:{op.WOUNDS}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Effects Helptext */}
      {showEffectshelp && (
        <Modal
          title="Equipment Effects Help"
          onClose={() => setShowEffectshelp(false)}
          footer={
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setShowEffectshelp(false)}>
                <h6>Close</h6>
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              The Effects field is for brief notes about what the equipment does. This is not a full description, which can be added in the Description field below.
            </p>
            <Markdown>
              {`Each individual effect has two parts separated by a single pipe: \`[part1]|[part2]\`. Chain multiple effects together by separating the individual effect strings with a caret (\`^\`).

Effects can be:
- Weapon mod
  - Modify the stats or weapon rules for existing weapons
- Operative mod
  - Modify the operative's stats
- Add weapon
  - Give operatives a new weapon
- Empty
  - No effect

It's either a Weapon Mod or an Operative Mod:

- Weapon Mod: \`[filter]:[filterValue]|[field]:[delta]\`
- Operative Mod: \`[field]|[delta]\`

---

##### Weapon Mods

Format: \`[filter]:[filterValue]|[field]:[delta]\`

Filters: \`weptype:[TYPE]\` — match by weapon type. Typical values: \`M\` (Melee) and \`R\` (Ranged).

Supported Fields:

- \`WR\`: Weapon Rules - Append free-form rule text to the weapon's rules. Appends with a comma if needed. Example text is added as-is.
- \`D\`: Damage - Add Normal/Critical damage deltas. Use N/C numbers. Example: \`1/0\`.
- \`A\`: Attacks - Add to Attacks. Use a signed or unsigned number. Example: \`+1\` or \`1\`.

Examples:

- \`weptype:M|DMG:1/0\`: For all Melee weapons, add +1 Normal damage, +0 Critical.
- \`weptype:R|ATK:+1\`: For all Ranged weapons, add +1 Attack.
- \`weptype:R|WR:Bal\`: For all Ranged weapons, add Balanced to the weapon's rules.

---

##### Operative Mods

Format: \`[field]|[delta]\`

Supported Fields:
- \`M\`: Movement (inches). Provide a number; inches are added automatically. Example: \`2 → +2"\`.
- \`SV\`: Save (lower is better). Provide a signed number:
  - \`-1\` improves the save (e.g., 4+ → 3+).
  - \`+1\` worsens the save (e.g., 4+ → 5+).
- \`W\`: Wounds. Provide a number to add.

Examples:

- \`M|2\` — +2" Move.
- \`SV|-1\` — Improve Save by 1 (e.g., 4+ → 3+).
- \`W|+2\` — +2 Wounds.

---

##### Add Weapon

Format: \`ADDWEP:[Weapon Name]|[Type]|[ATK]|[HIT]|[DMG]|[WR]\`

- \`[Weapon Name]\`: Name of the weapon.
- \`[Type]\`: Weapon type. Typical values: \`M\` (Melee), \`R\` (Ranged), \`E\` (Exotic), \`P\` (Pistol).
- \`[ATK]\`: Attacks value..
- \`[HIT]\`: Hit value.
- \`[DMG]\`: Damage value. Load as \`[Normal]/[Critical]\`.
- \`[WR]\`: Weapon Rules. Free-form text for weapon rules (e.g., \`Rending\`, \`Balanced\`, \`Blast\`).

Examples:

- \`ADDWEP:Combat Blade|M|5|3+|3/4|\`
- \`ADDWEP:Pistol|R|4|3+|4/5|Rending\`

Gotchas

Multiple effects can be combined with \`^\` (for example, \`M|2^SV|-1\`). Each effect still uses exactly one \`|\`.
Empty values are ignored.
`}
            </Markdown>
          </div>
        </Modal>
      )}
    </div>
  )
}
  
