'use client'

/*
  The roster you are currently playing against, as set on a roster's Opponent
  tab. Keyed per roster rather than per user - one player can have several
  rosters, and each carries its own current opponent.

  Written by the Opponent tab during the game and read back by the Record
  Battle form afterwards, so the key string lives here rather than in either
  of them.
*/

export const opponentRosterKey = (rosterId: string) => `opponent_${rosterId}`

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getOpponentRosterId(rosterId: string): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(opponentRosterKey(rosterId))
}

export function setOpponentRosterId(rosterId: string, opponentRosterId: string) {
  if (!isBrowser()) return
  window.localStorage.setItem(opponentRosterKey(rosterId), opponentRosterId)
}

export function clearOpponentRosterId(rosterId: string) {
  if (!isBrowser()) return
  window.localStorage.removeItem(opponentRosterKey(rosterId))
}
