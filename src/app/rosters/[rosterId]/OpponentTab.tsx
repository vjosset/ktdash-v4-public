'use client'

import OpCard from '@/components/op/OpCard'
import { KillteamLink, UserLink } from '@/components/shared/Links'
import { parseRosterId } from '@/lib/utils/utils'
import { WeaponRule } from '@/lib/utils/weaponRules'
import { RosterPlain } from '@/types'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { FiEdit2 } from 'react-icons/fi'
const isBrowser = () => typeof window !== 'undefined'
const opponentKey = (id: string) => `opponent_${id}`
const getOpponentRosterId = (id: string) => isBrowser() ? localStorage.getItem(opponentKey(id)) : null
const setOpponentRosterId = (id: string, opId: string) => isBrowser() && localStorage.setItem(opponentKey(id), opId)
const clearOpponentRosterId = (id: string) => isBrowser() && localStorage.removeItem(opponentKey(id))

interface OpponentTabProps {
  myRosterId: string
  allWeaponRules: WeaponRule[]
  isActive: boolean
}

export default function OpponentTab({ myRosterId, allWeaponRules, isActive }: OpponentTabProps) {
  const [opponentRosterId, setOpponentRosterIdState] = useState<string | null>(
    () => getOpponentRosterId(myRosterId)
  )
  const [inputValue, setInputValue] = useState('')
  const [opponentRoster, setOpponentRoster] = useState<RosterPlain | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a ref that's always current — checked inside the interval callback
  // so we never rely on effect cleanup timing to stop fetches.
  const isActiveRef = useRef(isActive)
  useEffect(() => { isActiveRef.current = isActive }, [isActive])

  const fetchRoster = () => {
    if (!opponentRosterId) return
    fetch(`/api/rosters/${opponentRosterId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data: RosterPlain) => {
        setOpponentRoster(data)
        setError(null)
      })
      .catch(() => setError('Failed to load opponent roster'))
  }

  // Pre-fetch on mount so data is ready before the tab is first opened
  useEffect(() => {
    if (opponentRosterId) fetchRoster()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Interval runs continuously but skips the fetch when the tab is not active
  useEffect(() => {
    if (!opponentRosterId) return
    const interval = setInterval(() => {
      if (isActiveRef.current) fetchRoster()
    }, 2000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentRosterId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const id = parseRosterId(inputValue.trim())
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rosters/${id}`)
      if (!res.ok) throw new Error('Not found')
      const data: RosterPlain = await res.json()
      setOpponentRosterId(myRosterId, id)
      setOpponentRosterIdState(id)
      setOpponentRoster(data)
    } catch {
      setError('Roster not found. Check the ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    clearOpponentRosterId(myRosterId)
    setOpponentRosterIdState(null)
    setOpponentRoster(null)
    setInputValue('')
    setError(null)
  }

  // Select form — shown when no opponent is set yet
  if (!opponentRosterId || !opponentRoster) {
    return (
      <div className="max-w-md mx-auto mt-8 space-y-8 px-2">
        {/* My Roster ID */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-widest">My Roster ID</p>
          <p className="font-mono text-3xl uppercase font-bold tracking-wider text-main break-all select-all">{myRosterId}</p>
          <p className="text-xs text-muted-foreground">Share this with your opponent so they can track your roster</p>
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* Opponent input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor="opponentId" className="block text-sm font-medium">
            Opponent Roster ID or URL
          </label>
          <div className="flex gap-2">
            <input
              id="opponentId"
              type="text"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value.toUpperCase()); setError(null) }}
              placeholder="e.g. abc123 or https://ktdash.app/rosters/abc123"
              className={`flex-1 min-w-0 rounded border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-main ${error ? 'border-destructive' : 'border-border'}`}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="flex-shrink-0 rounded bg-main text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading ? 'Loading…' : 'Set'}
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    )
  }

  // Opponent roster view
  const ops = opponentRoster.ops ?? []

  return (
    <div>
      {/* Opponent header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="min-w-0">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-left group"
            title="Change opponent"
          >
            <h5 className="font-title text-heading group-hover:text-main transition-colors truncate max-w-[12rem]">{opponentRoster.rosterName}</h5>
            <FiEdit2 className="flex-shrink-0 text-muted-foreground group-hover:text-main transition-colors" size={14} />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-0.5">
            {opponentRoster.killteam && <KillteamLink killteam={opponentRoster.killteam} />}
            <span>by</span>
            <UserLink userName={opponentRoster.user?.userName || 'Unknown'} />
          </div>
        </div>

        {/* Read-only Turn / VP / CP */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            { label: 'VP', value: opponentRoster.VP },
            { label: 'CP', value: opponentRoster.CP },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-sm font-bold text-main uppercase tracking-wide leading-none">{label}</span>
              <span className="text-lg font-bold leading-tight">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive text-center mb-4">{error}</p>}

      {/* Deployed operatives */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ops.filter(op => op.isDeployed).map((op, idx) => (
          <OpCard
            key={op.opId}
            seq={idx + 1}
            op={op}
            roster={opponentRoster}
            killteam={opponentRoster.killteam ?? null}
            isOwner={false}
            allWeaponRules={allWeaponRules}
            onOpUpdated={() => {}}
            onOpDeleted={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onMoveFirst={() => {}}
            onMoveLast={() => {}}
            onPortraitClick={() => {}}
          />
        ))}
      </div>
    </div>
  )
}
