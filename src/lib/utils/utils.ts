import { customAlphabet } from 'nanoid'

export function toLocalIsoDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().split('T')[0] // YYYY-MM-DD
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

export function getShortOpTypeName(opTypeName?: string): string | null | undefined {
  if (opTypeName == null) {
    // covers both null and undefined
    return opTypeName;
  }

  return opTypeName
    .replace("Aquilon ", "")
    .replace("Arbites ", "")
    .replace("Battleclade ", "")
    .replace("Battleclade ", "")
    .replace("Brood Brother ", "")
    .replace("Death Korps ", "")
    .replace(" Drone", "")
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
