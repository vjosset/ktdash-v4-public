import { AbilityPlain, KillteamPlain, OpPlain, OptionPlain, OpType, OpTypePlain, RosterPlain } from '@/types'
import { format } from 'date-fns'
import { customAlphabet } from 'nanoid'

/*
  The calendar date a given instant falls on, in a specific IANA timezone.
  Intl is the only dependency-free way to get this right: the getTimezoneOffset
  approach is locked to whatever zone the Node process happens to run in, which
  is not the viewer's, and it breaks across DST boundaries.
*/
export function toZonedIsoDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find(p => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}` // YYYY-MM-DD
}

/*
  The UTC instant at which a calendar day begins in a given zone. Two passes
  because the offset that applies is the one in force at the answer, not the one
  at the naive guess - a single pass lands an hour out on the days either side of
  a DST switch.
*/
export function zonedDayStartUtc(isoDate: string, timeZone: string): Date {
  const naive = Date.parse(`${isoDate}T00:00:00Z`)
  const firstPass = naive - zoneOffsetMs(new Date(naive), timeZone)

  return new Date(naive - zoneOffsetMs(new Date(firstPass), timeZone))
}

/*
  How far ahead of UTC a zone sits at a given instant, in milliseconds. Reads the
  wall clock in the zone and treats it as if it were UTC - the gap between that
  and the real instant is the offset.
*/
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)

  const get = (type: string) => Number(parts.find(p => p.type === type)!.value)
  // Midnight comes back as hour 24 rather than 0 under hour12: false in some ICU builds
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))

  return asUtc - instant.getTime()
}

/*
  Validate a client-supplied IANA zone, falling back to UTC. Intl throwing a
  RangeError is the only reliable way to test one, and a bad value is a client
  bug rather than a reason to fail the whole request.
*/
export function resolveTimeZone(value: string | null | undefined): string {
  if (!value) return 'UTC'

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return 'UTC'
  }
}

/*
  Timestamps shift into the viewer's own timezone but always render in the same
  pattern, so the same moment reads identically everywhere in the app.
  Deliberately not toLocaleString, which reorders the fields per locale
  (03/09 vs 09/03) and makes two timestamps on one screen disagree.
  Accepts a string because dates arrive from the API as JSON.
*/
export function toLocalDateTime(value: Date | string): string {
  return format(new Date(value), 'yyyy-MM-dd HH:mm')
}

export function getRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function ucwords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

// Define your safe alphabet
const SAFE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

// Create a reusable generator
const generateId = customAlphabet(SAFE_ALPHABET, 10) // change length if needed

// Export a wrapper function
export function genId(): string {
  return generateId()
}

export function getShortOpTypeName(op : OpType | OpTypePlain | null | undefined): string | null | undefined {
  if (op == null || op.opTypeName == null) {
    // covers both null and undefined
    return op?.opTypeName;
  }

  if (op.killteamId.includes('INQ')) {
    // Use full names for Inquisition
    return op.opTypeName;
  }

  return op.opTypeName
    .replace("Aquilon ", "")
    .replace("Arbites ", "")
    .replace("Battleclade ", "")
    .replace("Battleclade ", "")
    .replace("Brood Brother ", "")
    .replace("Death Korps ", "")
    .replace("Fellgor ", "")
    .replace("Goremonger ", "")
    .replace("Hearthkyn ", "")
    .replace("Kabalite ", "")
    .replace("Kasrkin ", "")
    .replace("Kommando ", "")
    .replace("Kroot ", "")
    .replace("Legionary ", "")
    .replace("Legionary ", "")
    .replace("Mandrake ", "")
    .replace("Navis ", "")
    .replace("Night Lord ", "")
    .replace("Novitiate ", "")
    .replace(" Pathfinder", "")
    .replace("Plague Marine ", "")
    .replace("Plasmacyte ", "")
    .replace("Ratling ", "")
    .replace("Ravener ", "")
    .replace("Sanctifier ", "")
    .replace("Scout ", "")
    .replace("Space Hulk Veteran ", "")
    .replace("Traitor ", "")
    .replace("Vespid ", "")
    .replace("Voidscarred ", "")
    .replace("Warpdiver ", "")
    .replace("Yaegir ", "");
}

export function sanitizeFileName(fileName: string): string {
  // Remove any character that isn't a letter, number, space, or hyphen
  return fileName
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters (except spaces and hyphens)
    .replace(/[\s_-]+/g, '_') // Replace spaces or multiple underscores with a single underscore
    .toLowerCase(); // Optionally make it lowercase for consistency
}

export function getOpUniqueAbilitiesAndOptions(roster?: RosterPlain, op?: OpPlain) {
  if (!op || !roster) {
    return { abilities: [], options: [] }
  }

  const deployedOps: OpPlain[] = roster.ops?.filter((candidate) => candidate.isDeployed) ?? []
  const others = deployedOps.filter((candidate) => candidate.opId !== op.opId)
  return getUniqueAbilitiesAndOptionsForCarrier(op, others)
}

export function getOpTypeUniqueAbilitiesAndOptions(killteam?: KillteamPlain, opType?: OpTypePlain) {
  if (!killteam || !opType) {
    return { abilities: [], options: [] }
  }

  const otherOpTypes = (killteam.opTypes ?? []).filter((candidate) => candidate.opTypeId !== opType.opTypeId)
  return getUniqueAbilitiesAndOptionsForCarrier(opType, otherOpTypes)
}

type AbilityOptionCarrier = {
  abilities?: AbilityPlain[] | null
  options?: OptionPlain[] | null
}

function getUniqueAbilitiesAndOptionsForCarrier(target: AbilityOptionCarrier | undefined | null, others: AbilityOptionCarrier[]) {
  if (!target) {
    return { abilities: [], options: [] }
  }

  const otherAbilityKeys = new Set<string>()
  const otherOptionKeys = new Set<string>()

  for (const other of others) {
    for (const ability of other?.abilities ?? []) {
      otherAbilityKeys.add(ability.abilityName)
    }
    for (const option of other?.options ?? []) {
      otherOptionKeys.add(option.optionName)
    }
  }

  const uniqueAbilities: AbilityPlain[] = []
  const uniqueOptions: OptionPlain[] = []
  const seenAbilityIds = new Set<string>()
  const seenOptionIds = new Set<string>()

  for (const ability of target.abilities ?? []) {
    const id = ability.abilityName
    if (seenAbilityIds.has(id)) continue
    seenAbilityIds.add(id)
    if (!otherAbilityKeys.has(id)) uniqueAbilities.push(ability)
  }

  for (const option of target.options ?? []) {
    const id = option.optionName
    if (seenOptionIds.has(id)) continue
    seenOptionIds.add(id)
    if (!otherOptionKeys.has(id)) uniqueOptions.push(option)
  }

  return { abilities: uniqueAbilities, options: uniqueOptions }
}

function getRepeatedAbilitiesAndOptionsFromCarriers(entities: AbilityOptionCarrier[] | undefined | null) {
  if (!entities || entities.length === 0) {
    return { abilities: [], options: [] }
  }

  const abilityCount = new Map<string, number>()
  const optionCount = new Map<string, number>()
  const abilityFirst = new Map<string, AbilityPlain>()
  const optionFirst = new Map<string, OptionPlain>()

  for (const entity of entities) {
    for (const ability of entity?.abilities ?? []) {
      const id = ability.abilityName
      if (!abilityFirst.has(id)) abilityFirst.set(id, ability)
      abilityCount.set(id, (abilityCount.get(id) ?? 0) + 1)
    }

    for (const option of entity?.options ?? []) {
      const id = option.optionName
      if (!optionFirst.has(id)) optionFirst.set(id, option)
      optionCount.set(id, (optionCount.get(id) ?? 0) + 1)
    }
  }

  const abilities: AbilityPlain[] = []
  const options: OptionPlain[] = []
  const seenAbilityIds = new Set<string>()
  const seenOptionIds = new Set<string>()

  for (const entity of entities) {
    for (const ability of entity?.abilities ?? []) {
      const id = ability.abilityName
      if (!seenAbilityIds.has(id) && (abilityCount.get(id) ?? 0) > 1) {
        abilities.push(abilityFirst.get(id)!)
        seenAbilityIds.add(id)
      }
    }

    for (const option of entity?.options ?? []) {
      const id = option.optionName
      if (!seenOptionIds.has(id) && (optionCount.get(id) ?? 0) > 1) {
        options.push(optionFirst.get(id)!)
        seenOptionIds.add(id)
      }
    }
  }

  return { abilities, options }
}

export function getRosterRepeatedAbilitiesAndOptions(roster: RosterPlain | undefined) {
  if (!roster) {
    return { abilities: [], options: [] }
  }

  const deployedOps: OpPlain[] = roster.ops?.filter((op) => op.isDeployed) ?? []
  return getRepeatedAbilitiesAndOptionsFromCarriers(deployedOps)
}

export function getKillteamRepeatedAbilitiesAndOptions(killteam: KillteamPlain | undefined) {
  if (!killteam) {
    return { abilities: [], options: [] }
  }

  return getRepeatedAbilitiesAndOptionsFromCarriers(killteam.opTypes ?? [])
}

/*
  Accepts either a bare roster ID or a roster URL pasted from the address bar,
  in any casing. Returns null for empty input.
*/
export function parseRosterId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split('/').filter(Boolean)
  const idx = parts.findIndex((part) => part.toUpperCase() === 'ROSTERS')
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]

  return trimmed
}
