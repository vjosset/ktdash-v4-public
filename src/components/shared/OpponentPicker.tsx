'use client'

import { RosterLink, UserLink } from '@/components/shared/Links'
import { Button, Input } from '@/components/ui'
import { BattleRosterInfo, RosterIdentity } from '@/types'
import { FormEvent, useEffect, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'

// Same threshold as the search bar on a user's own roster list
const ROSTER_FILTER_MIN_COUNT = 6

type ParsedInput =
  | { kind: 'roster'; value: string }
  | { kind: 'player'; value: string }
  | { kind: 'either'; value: string }

/*
  A link says what it is; a bare value could be a roster ID or a username, so
  it is tried as a roster first (the long-standing behaviour) and then as a
  player.
*/
function parseOpponentInput(input: string): ParsedInput | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split('/').filter(Boolean)
  const after = (segment: string) => {
    const idx = parts.findIndex(part => part.toLowerCase() === segment)
    return idx >= 0 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1].split(/[?#]/)[0]) : null
  }

  const rosterId = after('rosters')
  if (rosterId) return { kind: 'roster', value: rosterId }
  const userName = after('users')
  if (userName) return { kind: 'player', value: userName }

  return { kind: 'either', value: trimmed }
}

async function fetchRosterExists(rosterId: string): Promise<boolean> {
  const res = await fetch(`/api/rosters/${encodeURIComponent(rosterId)}/identity`)
  return res.ok
}

// Null when the player doesn't exist or is private - the server doesn't say which
async function fetchPlayerRosters(userName: string): Promise<RosterIdentity[] | null> {
  const res = await fetch(`/api/users/${encodeURIComponent(userName)}/rosters`)
  return res.ok ? await res.json() : null
}

/*
  Choose an opponent's roster by roster ID, by player name, or from the people
  you have played recently. Picking a player lists their rosters to choose
  from, so nobody has to read out a roster code before every game.

  onPick does the caller's own validation and returns an error to show, or
  null once it has accepted the roster.
*/
export default function OpponentPicker({
  myUserId,
  onPick,
  inputId,
}: {
  myUserId?: string
  onPick: (rosterId: string) => Promise<string | null>
  inputId?: string
}) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [recents, setRecents] = useState<BattleRosterInfo[]>([])
  // The player being chosen from, once one has been found by name
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [playerRosters, setPlayerRosters] = useState<RosterIdentity[]>([])
  const [lastRosterId, setLastRosterId] = useState<string | null>(null)
  const [rosterQuery, setRosterQuery] = useState('')

  // Quick picks are a convenience: any failure just leaves them out
  useEffect(() => {
    let cancelled = false
    fetch('/api/battles/opponents')
      .then(res => (res.ok ? res.json() : []))
      .then((data: BattleRosterInfo[]) => { if (!cancelled) setRecents(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const pick = async (rosterId: string) => {
    setBusy(true)
    setError(null)
    const pickError = await onPick(rosterId)
    setBusy(false)
    if (pickError) setError(pickError)
  }

  // False when there is no such (public) player, so the caller can try something else
  const openPlayer = async (userName: string, highlightRosterId: string | null = null): Promise<boolean> => {
    const rosters = await fetchPlayerRosters(userName)
    if (!rosters) return false

    if (rosters.length === 0) {
      setError(`${userName} has no rosters yet. Ask them to create one, or enter a roster ID.`)
      return true
    }
    if (myUserId && rosters[0].userId === myUserId) {
      setError('That’s you. Enter your opponent’s name or roster ID.')
      return true
    }
    // Nothing to choose between
    if (rosters.length === 1) {
      await pick(rosters[0].rosterId)
      return true
    }

    setPlayerName(rosters[0].userName)
    setPlayerRosters(rosters)
    setLastRosterId(highlightRosterId)
    setRosterQuery('')
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseOpponentInput(input)
    if (!parsed) return

    setBusy(true)
    setError(null)
    try {
      if (parsed.kind !== 'player' && (await fetchRosterExists(parsed.value))) {
        await pick(parsed.value)
        return
      }
      if (parsed.kind !== 'roster' && (await openPlayer(parsed.value))) return

      setError(
        parsed.kind === 'roster'
          ? 'Roster not found. Check the ID and try again.'
          : 'No roster or player found. Some players can only be found by roster ID.',
      )
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleRecent = async (opponent: BattleRosterInfo) => {
    setBusy(true)
    setError(null)
    try {
      if (await openPlayer(opponent.userName, opponent.rosterId)) return

      // A private player's rosters can't be listed by name - offer the one they
      // brought last time instead
      if (opponent.rosterId) await pick(opponent.rosterId)
      else setError(`Couldn’t load ${opponent.userName}’s rosters. Enter a roster ID instead.`)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  // Choosing among one player's rosters
  if (playerName) {
    const query = rosterQuery.trim().toLowerCase()
    const ordered = [
      ...playerRosters.filter(r => r.rosterId === lastRosterId),
      ...playerRosters.filter(r => r.rosterId !== lastRosterId),
    ]
    const visible = query
      ? ordered.filter(r => r.rosterName.toLowerCase().includes(query) || r.killteamName.toLowerCase().includes(query))
      : ordered

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1 text-sm">
            Which roster is <UserLink userName={playerName} newTab /> using?
          </span>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted hover:text-main transition-colors"
            onClick={() => { setPlayerName(null); setError(null) }}
          >
            <FiArrowLeft /> Back
          </button>
        </div>

        {playerRosters.length > ROSTER_FILTER_MIN_COUNT && (
          <Input
            type="search"
            placeholder="Search their rosters..."
            aria-label={`Search ${playerName}'s rosters`}
            value={rosterQuery}
            onChange={e => setRosterQuery(e.target.value)}
            className="my-0 px-2"
          />
        )}

        <ul className="list-none pl-0 max-h-72 overflow-y-auto border border-border rounded divide-y divide-border">
          {visible.map(roster => (
            <li key={roster.rosterId} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-sm">
              <RosterLink
                rosterId={roster.rosterId}
                rosterName={roster.rosterName}
                disabled={busy}
                onClick={() => pick(roster.rosterId)}
              />
              {roster.rosterId === lastRosterId && (
                <span className="text-muted italic">Last played</span>
              )}
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-muted">No rosters match &quot;{rosterQuery.trim()}&quot;</li>
          )}
        </ul>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          id={inputId}
          value={input}
          onChange={e => { setInput(e.target.value); setError(null) }}
          placeholder="Roster ID, player name or link"
          autoComplete="off"
          className="my-0 px-2"
        />
        <Button type="submit" variant="ghost" disabled={busy || !input.trim()} className="flex-shrink-0">
          {busy ? 'Finding…' : 'Find'}
        </Button>
      </form>

      {recents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Recent:</span>
          {recents.map(opponent => (
            <UserLink
              key={opponent.userId}
              userName={opponent.userName}
              disabled={busy}
              onClick={() => handleRecent(opponent)}
            />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
