'use client'
import { showInfoModal } from '@/lib/utils/showInfoModal'
import { parseWeaponRules, WeaponRule } from '@/lib/utils/weaponRules'
import { WeaponPlain } from '@/types'
import React from 'react'
import { GiCrossedSwords } from 'react-icons/gi'
import { TfiTarget } from 'react-icons/tfi'
import { Checkbox } from '../ui'
import Markdown from '../ui/Markdown'

type WeaponTableProps = {
  weapons: WeaponPlain[]
  selectedWepIds?: string[]
  allWeaponRules: WeaponRule[]
  onToggleWeapon?: (gearId: string) => void
}

export default function WeaponTable({ 
  weapons,
  selectedWepIds: selectedWepIds = [],
  allWeaponRules,
  onToggleWeapon: onToggleWeapon,
}: WeaponTableProps) {

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-muted border-t border-border">
            <th className="text-left w-4/6"><h6>Weapons</h6></th>
            <th className="text-center"><h6>ATK</h6></th>
            <th className="text-center"><h6>HIT</h6></th>
            <th className="text-center"><h6>DMG</h6></th>
          </tr>
        </thead>
        <tbody>
          {weapons.map((wep) => 
            <React.Fragment  key={wep.wepId}>
              {wep.profiles && wep.profiles?.length == 1 && wep.profiles[0] && (
                <tr key={wep.wepId}>
                  <td className="py-0.5">
                    {onToggleWeapon && (
                    <Checkbox
                      type="checkbox"
                      checked={selectedWepIds.includes(wep.wepId)}
                      onChange={() => onToggleWeapon(wep.wepId)}
                    />
                    )}
                    { ' ' }
                    { wep.wepType == 'M' ? (<GiCrossedSwords className="inline-block" />) : (<TfiTarget className="inline-block" />) }
                    { ' ' }
                    {wep.wepName}
                    { ' ' }
                    {wep.profiles[0].WR != '' &&
                    <em className="cursor-pointer hover:text-main text-muted hastip" onClick={() => {
                      const parsed = parseWeaponRules(allWeaponRules, wep.profiles?.[0].WR ?? '')
                      showInfoModal({
                        title: wep.wepName,
                        body: (
                          <div className="space-y-4">
                            {parsed.map((special, idx) => (
                              <div key={idx}>
                                <span className="font-semibold text-muted">{special.ruleName}:</span>
                                <Markdown>{special.description}</Markdown>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    }}
                    >
                      ({wep.profiles[0].WR})
                    </em>
                    }  
                  </td>
                  {/* Using leading-none to remove extra space between table rows */}
                  <td className="text-center py-0.5"><h5 className="text-main leading-none">{wep.profiles[0].ATK ?? '-'}</h5></td>
                  <td className="text-center py-0.5"><h5 className="text-main leading-none">{wep.profiles[0].HIT ?? '-'}</h5></td>
                  <td className="text-center py-0.5"><h5 className="text-main leading-none">{wep.profiles[0].DMG ?? '-'}</h5></td>
                </tr>
              )}

              {(wep.profiles?.length ?? 0) > 1 && (
                <>
                  <tr key={wep.wepId}>
                    <td className="py-0.5">
                      {onToggleWeapon && (
                        <Checkbox
                          type="checkbox"
                          checked={selectedWepIds.includes(wep.wepId)}
                          onChange={() => onToggleWeapon(wep.wepId)}
                        />
                      )}
                      { ' ' }
                      {/*<img className="inline highlightblack" src={`/icons/white/wepType${gear.TYP}.png`} width="13" />*/}
                      { wep.wepType == 'M' ? (<GiCrossedSwords className="inline-block" />) : (<TfiTarget className="inline-block" />) }
                      { ' ' }
                      {wep.wepName}
                    </td>
                    <td></td><td></td><td></td>
                  </tr>
                  {wep.profiles?.map((pro, idx) => (
                    <tr key={`${wep.wepId}-${idx}`}>
                      <td className="pl-2">
                        {pro.profileName}
                        { ' ' }
                        {pro.WR != '' && (
                          <em className="cursor-pointer hover:text-main text-muted hastip" onClick={() => {
                            const parsed = parseWeaponRules(allWeaponRules, pro.WR ?? '')
                            showInfoModal({
                              title: `${wep.wepName} - ${pro.profileName}`,
                              body: (
                                <div className="space-y-4">
                                  {parsed.map((special, idx) => (
                                    <div key={idx}>
                                      <span className="font-semibold text-muted">{special.ruleName}:</span>
                                      <Markdown>{special.description}</Markdown>
                                    </div>
                                  ))}
                                </div>
                              )
                            })
                          }}
                          >
                            ({pro.WR})
                          </em>
                        )}
                      </td>
                      <td className="text-center py-0.5"><h5 className="text-main leading-none">{pro.ATK ?? '-'}</h5></td>
                      <td className="text-center py-0.5"><h5 className="text-main leading-none">{pro.HIT ?? '-'}</h5></td>
                      <td className="text-center py-0.5"><h5 className="text-main leading-none">{pro.DMG ?? '-'}</h5></td>
                    </tr>
                  ))}
                </>
              )}
            </React.Fragment>
          )}
        </tbody>
      </table>
    </div>
  )
}
