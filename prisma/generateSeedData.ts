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
      ops,
    ] = await Promise.all([
      prisma.faction.findMany({ orderBy: { seq: 'asc' } }),
      prisma.killteam.findMany({ orderBy: { seq: 'asc' } }),
      prisma.opType.findMany({ orderBy: { seq: 'asc' } }),
      prisma.ability.findMany({ orderBy: { abilityId: 'asc' } }),
      prisma.equipment.findMany({ orderBy: [{ seq: 'asc' }] }),
      prisma.option.findMany({ orderBy: [{ seq: 'asc' }] }),
      prisma.ploy.findMany({ orderBy: [{seq: 'asc' }] }),
      prisma.weapon.findMany({ orderBy: { wepId: 'asc' } }),
      prisma.weaponProfile.findMany({ orderBy: [{wepprofileId: 'asc'}]}),
      prisma.weaponRule.findMany({ orderBy: [{code: 'asc'}]}),
      prisma.user.findMany({
        where: {
          userId: {
            in: userIds
          }
        }
      }),
      prisma.roster.findMany({
        where: {
          userId: {
            in: userIds
          }
        },
        orderBy: [{ userId: 'asc'}, { seq: 'asc' }]
      }),
      prisma.op.findMany({
        where: {
          roster: {
            userId: {
              in: userIds
            }
          }
        },
        orderBy: { seq: 'asc' }
      })
    ])

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
