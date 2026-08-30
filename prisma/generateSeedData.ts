/*
  This file contains code to pull data from the main database to be converted to JSON objects for seeding.
  This is used when playtesting and maintenance involves updates directly in the DB and we want to rebuild the seeding scripts for others to contribute to the project.
*/

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()
const userIds = [
  'prebuilt',
]

async function exportCoreData() {
  try {
    // Get data from database
    const [
      factions,
      killteams,
      weaponrules,
      users,
    ] = await Promise.all([
      prisma.faction.findMany({ orderBy: { seq: 'asc' } }),
      prisma.killteam.findMany({ orderBy: [{ seq: 'asc' }, { killteamId: 'asc' }], where: { NOT: { factionId: 'HBR'}} }),
      prisma.weaponRule.findMany({ orderBy: { code: 'asc' } }),
      prisma.user.findMany({
        where: {
          userId: {
            in: userIds
          }
        }
      })
    ])

    const [
      optypes,
      equipments,
      ploys,
    ] = await Promise.all([
      prisma.opType.findMany({ where: { killteamId: { in: killteams.map(kt => kt.killteamId) } }, orderBy: { seq: 'asc' } }),
      // killteamId: null rows are universal equipment - `in` never matches NULL, so it must be OR'd in explicitly
      prisma.equipment.findMany({ where: { OR: [{ killteamId: { in: killteams.map(kt => kt.killteamId) } }, { killteamId: null }] }, orderBy: { seq: 'asc' } }),
      prisma.ploy.findMany({ where: { killteamId: { in: killteams.map(kt => kt.killteamId) } }, orderBy: { seq: 'asc' } })
    ])

    const [
      abilities,
      weapons,
      options,
    ] = await Promise.all([
      prisma.ability.findMany({ where: { opTypeId: { in: optypes.map(ot => ot.opTypeId) } }, orderBy: { abilityName: 'asc' } }),
      prisma.weapon.findMany({ where: { opTypeId: { in: optypes.map(ot => ot.opTypeId) } }, orderBy: { seq: 'asc' } }),
      prisma.option.findMany({ where: { opTypeId: { in: optypes.map(ot => ot.opTypeId) } }, orderBy: { seq: 'asc' } }),
    ])

    const weaponprofiles = await prisma.weaponProfile.findMany({ where: { wepId: { in: weapons.map(wep => wep.wepId) } }, orderBy: { seq: 'asc' } })

    const rosters = await prisma.roster.findMany(
      {
        where:
        {
          userId: {
            in: userIds
          },
          killteamId: {
            in: killteams.map(kt => kt.killteamId)
          }
        },
        orderBy: [{ userId: 'asc'}, { seq: 'asc' }]
      })
    
    const ops = await prisma.op.findMany(
      {
        where: {
          rosterId: {
            in: rosters.map(r => r.rosterId)
          }
        },
        orderBy: { seq: 'asc' }
      }
    )

    // Clear the userIds from the homebrew killteams
    killteams.forEach(kt => {
        kt.userId = null
    })

    // Combine into single object
    const coreData = {
      factions,
      killteams,
      optypes,
      abilities,
      equipments,
      options,
      ploys,
      weapons,
      weaponprofiles,
      weaponrules,
      users,
      rosters,
      ops
    }

    // Write to file
    await fs.writeFile(
      path.join(__dirname, '../prisma/seed-data.json'),
      JSON.stringify(coreData, null, 2)
    )

    console.log('Core data exported successfully')
  } catch (error) {
    console.error('Error exporting core data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  exportCoreData()
}
