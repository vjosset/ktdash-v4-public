import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function runSeed(seed: any) {
  // Users
  if (seed.users) {
    console.log('  Seeding Users...')
    for (const user of seed.users) {
      await prisma.user.upsert({
        where: { userId: user.userId },
        update: {},
        create: user
      })
    }
  }

  // Factions
  if (seed.factions) {
    console.log('  Seeding Factions...')
    for (const faction of seed.factions) {
      await prisma.faction.upsert({
        where: { factionId: faction.factionId },
        update: {},
        create: faction
      })
    }
  }

  // Killteams
  if (seed.killteams) {
    console.log('  Seeding Killteams...')
    for (const killteam of seed.killteams) {
      await prisma.killteam.upsert({
        where: { killteamId: killteam.killteamId },
        update: {},
        create: killteam
      })
    }
  }

  // OpTypes
  if (seed.optypes) {
    console.log('  Seeding OpTypes...')
    for (const optype of seed.optypes) {
      await prisma.opType.upsert({
        where: { opTypeId: optype.opTypeId },
        update: {},
        create: optype
      })
    }
  }

  // Abilities
  if (seed.abilities) {
    console.log('  Seeding Abilities...')
    for (const ability of seed.abilities) {
      await prisma.ability.upsert({
        where: { abilityId: ability.abilityId },
        update: {},
        create: ability
      })
    }
  }

  // Equipments
  if (seed.equipments) {
    console.log('  Seeding Equipments...')
    for (const equipment of seed.equipments) {
      await prisma.equipment.upsert({
        where: { eqId: equipment.eqId },
        update: {},
        create: equipment
      })
    }
  }

  // Options
  if (seed.options) {
    console.log('  Seeding Options...')
    for (const option of seed.options) {
      await prisma.option.upsert({
        where: { optionId: option.optionId },
        update: {},
        create: option
      })
    }
  }

  // Ploys
  if (seed.ploys) {
    console.log('  Seeding Ploys...')
    for (const ploy of seed.ploys) {
      await prisma.ploy.upsert({
        where: { ployId: ploy.ployId },
        update: {},
        create: ploy
      })
    }
  }

  // Weapons
  if (seed.weapons) {
    console.log('  Seeding Weapons...')
    for (const weapon of seed.weapons) {
      await prisma.weapon.upsert({
        where: { wepId: weapon.wepId },
        update: {},
        create: weapon
      })
    }
  }

  // WeaponProfiles
  if (seed.weaponprofiles) {
    console.log('  Seeding WeaponProfiles...')
    for (const profile of seed.weaponprofiles) {
      await prisma.weaponProfile.upsert({
        where: { wepprofileId: profile.wepprofileId },
        update: {},
        create: profile
      })
    }
  }

  // WeaponRules
  if (seed.weaponrules) {
    console.log('  Seeding WeaponRules...')
    for (const rule of seed.weaponrules) {
      await prisma.weaponRule.upsert({
        where: { code: rule.code },
        update: {},
        create: rule
      })
    }
  }

  // Rosters
  if (seed.rosters) {
    console.log('  Seeding Rosters...')
    for (const roster of seed.rosters) {
      await prisma.roster.upsert({
        where: { rosterId: roster.rosterId },
        update: {},
        create: roster
      })
    }
  }

  // Operatives
  if (seed.ops) {
    console.log('  Seeding Operatives...')
    for (const op of seed.ops) {
      await prisma.op.upsert({
        where: { opId: op.opId },
        update: {},
        create: op
      })
    }
  }
}

async function main() {
  console.log('🌱 Seeding core data...')

  // Load core data
  let dataPath = path.join(__dirname, 'seed-data.json')
  let json = await fs.readFile(dataPath, 'utf-8')
  let seed = JSON.parse(json)

  // Run the seed
  await runSeed(seed)

  console.log('✅ Seeding complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
