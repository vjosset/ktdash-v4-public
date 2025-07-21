'use client'

import { showInfoModal } from '@/lib/utils/showInfoModal'
import { WeaponRule } from '@/lib/utils/weaponRules'
import { OpPlain, OpTypePlain } from '@/types'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { GiRollingDices } from 'react-icons/gi'
import Markdown from 'react-markdown'
import { toast } from 'sonner'
import WeaponTable from '../shared/WeaponTable'
import { Button, Checkbox, Label } from '../ui'
import Modal from '../ui/Modal'

interface OpEditorModalProps {
  isOpen: boolean
  op?: OpPlain
  rosterId: string
  killteamId: string
  allWeaponRules: WeaponRule[]
  onClose: () => void
  onSave: (updatedOp: OpPlain) => void
}

export default function OpEditorModal({
  isOpen,
  op,
  rosterId,
  killteamId,
  allWeaponRules,
  onClose,
  onSave,
}: OpEditorModalProps) {
  const isEditMode = !!op

  const [activeTab, setActiveTab] = useState<'details' | 'portrait'>('details')
  const [opTypes, setOpTypes] = useState<OpTypePlain[]>([])
  const [opTypeId, setOpTypeId] = useState(op?.opTypeId || '')
  const [opName, setOpName] = useState(op?.opName || '')
  const [wepIds, setWepIds] = useState<string[]>(
    Array.isArray(op?.wepIds) 
      ? op.wepIds 
      : op?.wepIds?.split(',').filter(Boolean) || []
  )
  const [optionIds, setOptionIds] = useState<string[]>(
    Array.isArray(op?.optionIds) 
      ? op.optionIds 
      : op?.optionIds?.split(',').filter(Boolean) || []
  )
  const [portraitFile, setPortraitFile] = useState<File | null>(null)
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showDeletePortraitConfirmation, setShowDeletePortraitConfirmation] = useState(false)

  const handlePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPortraitFile(file || null)
    setUploadError(null)
    if (file) {
      setPortraitPreview(URL.createObjectURL(file))
    } else {
      setPortraitPreview(null)
    }
  }

  const handlePortraitUpload = async () => {
    if (!portraitFile || !op?.opId) return
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('type', 'op')
      formData.append('rosterId', rosterId)
      formData.append('opId', op.opId)
      formData.append('image', portraitFile)

      const res = await fetch('/api/image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      // Optionally, refresh op data here
    } catch (err: any) {
      setUploadError(err.message)
    }
  }

  const selectedOpType = opTypes.find((optype) => optype.opTypeId === opTypeId)

  // Handle loading times
  useEffect(() => {
    if (isOpen && killteamId) {
      fetch(`/api/killteams/${killteamId}`)
        .then((res) => res.json())
        .then((killteamData) => {
          setOpTypes(killteamData.opTypes)
          if (!isEditMode && killteamData.opTypes.length > 0) {
            setOpTypeId(killteamData.opTypes[0].opTypeId)
          }
        })
        .catch((err) => {
          console.error('Failed to load ops:', err)
        })
    }
  }, [isOpen, killteamId, isEditMode])

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setOpName('')
      setOpTypeId('')
      setWepIds([])
      setOptionIds([])
    }
  }, [isOpen])

  // Preselect default Weapons
  useEffect(() => {
    if (!isEditMode && selectedOpType) {
      // Get all default weapon IDs from weapons
      const defaultWepIds = selectedOpType.weapons?.filter(wep => wep.isDefault)
        .map(wep => wep.wepId)

      setWepIds(defaultWepIds ?? [])
    }
  }, [opTypeId, isEditMode, selectedOpType])

  const toggleWeapon = (wepId: string) => {
    setWepIds((prev) =>
      prev.includes(wepId)
        ? prev.filter((id) => id !== wepId)
        : [...prev, wepId]
    )
  }
  
  const toggleOption = (optionId: string) => {
    console.log('Toggling option:', optionId)
    setOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    )
    console.log("Updated optionIds:", optionIds)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    
    try {
      if (activeTab === 'portrait') {
        // Handle portrait upload
        if (!portraitFile || !op?.opId) {
          throw new Error('No portrait selected')
        }

        const formData = new FormData()
        formData.append('type', 'op')
        formData.append('rosterId', rosterId)
        formData.append('opId', op.opId)
        formData.append('image', portraitFile)

        const res = await fetch(`/api/ops/${op.opId}/portrait`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }

        op.hasCustomPortrait = true
        op.updatedAt = new Date().toISOString() // Update timestamp

        onClose()
      } else {
        // Handle details update
        const payload = {
          rosterId,
          opName,
          opTypeId,
          wepIds: wepIds?.join(',') || '',
          optionIds: optionIds?.join(',') || '',
          currWOUNDS: op ? op.currWOUNDS : selectedOpType?.WOUNDS
        }

        const method = isEditMode ? 'PATCH' : 'POST'
        const url = isEditMode ? `/api/ops/${op!.opId}` : '/api/ops'

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          toast.error('Failed to save operative')
        }

        const result = await res.json()
        onSave(result)
        onClose()
      }
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setIsSaving(false)
    }
  }
  
  const showDesc = (title: string, description: string) => {
    showInfoModal({
      title: title,
      body: (
        <div className="prose prose-invert max-w-none">
          <Markdown>
            {description}
          </Markdown>
        </div>
      )
    })
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        title={`${isEditMode ? op.opName : 'Add Operative'}`}
        onClose={onClose}
        footer={
          <div className="flex justify-between items-start text-muted">
            <div className="whitespace-nowrap">
              {isEditMode && selectedOpType?.opTypeName}
            </div>

            {/* Right side: Buttons */}
            <div className="flex justify-end gap-2">
              <Button onClick={onClose} variant="ghost">
                <h6>Cancel</h6>
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={
                  (activeTab === 'portrait' && (!portraitFile || isSaving)) ||
                  (activeTab === 'details' && isSaving)
                }
              >
                <h6>
                  {isSaving ? 'Saving...' : 
                    activeTab === 'portrait' ? 'Save Portrait' : 'Save'}
                </h6>
              </Button>
            </div>
          </div>
        }>

        {/* Tab Bar */}
        {isEditMode && (
          <div className="flex border-b border-border mb-2">
            <button
              className={`px-4 py-2 font-bold ${activeTab === 'details' ? 'border-b-2 border-main text-main' : 'text-muted'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`px-4 py-2 font-bold ${activeTab === 'portrait' ? 'border-b-2 border-main text-main' : 'text-muted'}`}
              onClick={() => setActiveTab('portrait')}
            >
              Portrait
            </button>
          </div>
        )}

        {/* Tab Content - Details */}
        {activeTab === 'details' && (
          <div className="space-y-2">
            {!isEditMode &&
              <div className="grid grid-cols-[5rem_1fr] items-center gap-x-4">
                <Label>Operative</Label>
                <Listbox value={opTypeId} onChange={setOpTypeId}>
                  <div className="relative">
                    <ListboxButton className="w-full p-1 border border-border rounded-md text-sm text-left flex justify-between items-center">
                      {selectedOpType?.opTypeName || 'Select Op Type'}
                      <FiChevronDown className="w-4 h-4 text-muted-foreground" />
                    </ListboxButton>

                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card border border-border shadow-lg">
                      {opTypes.map((ot) => (
                        <ListboxOption
                          key={ot.opTypeId}
                          value={ot.opTypeId}
                          className={({ active }) =>
                            `px-4 py-2 cursor-pointer z-50 ${
                              active ? 'text-main' : 'text-foreground'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <div className={`flex ${selected ? 'text-main': ''}`}>
                              <span>{ot.opTypeName}</span>
                            </div>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>
            }

            <div className="grid grid-cols-[5rem_1fr] items-center gap-x-4">
              <Label>Name</Label>
              <div className="flex w-full">
                <input
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  placeholder={selectedOpType?.opTypeName || 'Select Op Type'}
                  className="flex-1 my-2 px-2 bg-card border border-border rounded-l-md appearance-none"
                />
                <button
                  type="button"
                  className="my-2 w-9 h-9 flex items-center justify-center border border-border border-l-0 rounded-r-md bg-zinc-900 hover:bg-zinc-800"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/namegen/${selectedOpType?.nameType}`)
                      if (!res.ok) throw new Error('Failed to fetch name')

                      const randomName = await res.text()
                      setOpName(randomName)
                    } catch (err) {
                      setOpName(selectedOpType?.nameType ?? selectedOpType?.opName ?? '')
                      console.error('Error getting random name:', err)
                    }
                  }}
                >
                  <GiRollingDices />
                </button>
              </div>
            </div>

            {/* Stats */}
            {selectedOpType && (
              <div className="grid grid-cols-4 gap-1 my-3 text-center">
                <h5>A <span className="stat text-main text-3xl">{selectedOpType.APL}</span></h5>
                <h5>M <span className="stat text-main text-3xl">{selectedOpType.MOVE}</span></h5>
                <h5>S <span className="stat text-main text-3xl">{selectedOpType.SAVE}</span></h5>
                <h5>W <span className="stat text-main text-3xl">{selectedOpType.WOUNDS}</span></h5>
              </div>
            )}

            {/* Weapons, Skills */}
            {selectedOpType && (
              <>
                {/* Weapons */}
                {(selectedOpType.weapons?.length ?? 0) > 0 && (
                  <WeaponTable
                    weapons={selectedOpType.weapons ?? []}
                    allWeaponRules={allWeaponRules} 
                    selectedWepIds={wepIds}
                    onToggleWeapon={toggleWeapon} />
                )}

                {/* Abilities */}
                {(selectedOpType.abilities?.length ?? 0) > 0 && (
                  <div className="border-t border-border grid grid-cols-2 gap-x-2">
                    <h6 className="text-muted">Abilities</h6>
                    {selectedOpType.abilities?.map((ability) => (
                      <span 
                        key={ability.abilityId}
                        onClick={() => showDesc(ability.abilityName + (ability.AP ? ` (${ability.AP} AP)` : ''), ability.description)} 
                        className="hastip cursor-pointer hover:text-main"
                      >
                        {ability.abilityName} {ability.AP ? `(${ability.AP} AP)` : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Options */}
                {(selectedOpType.options?.length ?? 0) > 0 && (
                  <div className="border-t border-border grid grid-cols-2 gap-x-2">
                    <h6 className="text-muted">Options</h6>
                    {selectedOpType.options?.map((opt) => (
                      <div key={opt.optionId}>
                        <Checkbox
                          type="checkbox"
                          checked={optionIds.includes(opt.optionId)}
                          onChange={() => toggleOption(opt.optionId)} />
                        <span
                            onClick={() => showDesc(opt.optionName, opt.description)}
                            className="mx-1 hastip cursor-pointer hover:text-main"
                          >
                          {opt.optionName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab Content - Portrait */}
        {activeTab === 'portrait' && (
          <div className="flex flex-col">
            <h5>New Portrait</h5>
            <p className="text-muted mb-2">
              Upload a portrait image for this operative.
              Images will be resized to 900x600 pixels.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePortraitChange}
              className="mb-2"
            />
            {portraitPreview && (
              <img
                src={portraitPreview}
                alt="Portrait Preview"
                className="rounded border border-border max-w-xs max-h-48 object-cover"
              />
            )}
            {uploadError && <p className="text-red-500">{uploadError}</p>}
            
            {op?.hasCustomPortrait && 
            <>
              <hr className="my-4" />
              <div className="flex justify-between items-center">
                <h5>Delete Portrait</h5>
                <Button
                  onClick={() => { setShowDeletePortraitConfirmation(true) }}>
                  <h6>Delete</h6>
                </Button>
              </div>
            </>}
            {uploadError && <p className="text-red-500">{uploadError}</p>}
          </div>
        )}
      </Modal>

      {showDeletePortraitConfirmation && (
        <Modal
          key="deletePortraitConfirmation"
          title="Delete Portrait"
          onClose={() => {}}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeletePortraitConfirmation(false)}>
                <h6>Cancel</h6>
              </Button>
              <Button 
                onClick={async () => {
                  setShowDeletePortraitConfirmation(false) // Close confirmation dialog
                  if (!op?.opId) return
                  try {
                    const res = await fetch(`/api/ops/${op.opId}/portrait`, {
                      method: 'DELETE'
                    })
                    if (!res.ok) {
                      const err = await res.json()
                      throw new Error(err.error || 'Failed to delete portrait')
                    }
                    setPortraitPreview(null)
                    setPortraitFile(null)
                    setShowDeletePortraitConfirmation(false)
                    onSave({ ...op, hasCustomPortrait: false })
                  } catch (err: any) {
                    setUploadError(err.message)
                  }
                }}
              >
                <h6>Delete</h6>
              </Button>
            </div>
          }>
          Are you sure you want to delete this operative's portrait? This action cannot be undone.
        </Modal>
      )}
    </>
  )
}
