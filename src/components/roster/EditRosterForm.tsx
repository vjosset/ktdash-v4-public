'use client'

import PortraitCropper, { getCroppedBlob } from '@/components/shared/PortraitCropper'
import { Button, Input, Label, Modal } from '@/components/ui'
import MarkdownEditor from '@/components/ui/MarkdownEditor'
import { getRosterPortraitUrl, toEpochMs } from '@/lib/utils/imageUrls'
import { RosterPlain } from '@/types'
import { Area } from 'react-easy-crop'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

const MAX_PORTRAIT_BYTES = 10 * 1024 * 1024 // 10MB

export interface EditRosterFormRef {
  handleSubmit: () => void
}

const EditRosterForm = forwardRef(function EditRosterForm(
  {
    roster,
    initialName,
    initialDescription,
    rosterId,
    hasCustomPortrait,
    onSave: onSubmit,
    onCancel,
  }: {
    roster: RosterPlain,
    initialName: string
    initialDescription: string
    rosterId: string
    hasCustomPortrait: boolean
    onSave: (name: string, description: string | null) => void
    onCancel: () => void
  },
  ref
) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [activeTab, setActiveTab] = useState<'details' | 'portrait'>('details')

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirmPortrait, setShowDeletePortraitConfirm] = useState(false)

  useImperativeHandle(ref, () => ({
    handleSubmit: async () => {
      if (activeTab === 'details') {
        onSubmit(name, description)
      } else if (activeTab === 'portrait') {
        await handlePortraitSave()
      }
    }
  }))

  const handlePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setUploadError(null)
    if (!file) return
    if (file.size > MAX_PORTRAIT_BYTES) {
      setUploadError('File too large. Max size is 10MB.')
      return
    }
    setRawImageSrc(URL.createObjectURL(file))
    setCroppedAreaPixels(null)
  }

  const handlePortraitSave = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return
    setIsSaving(true)
    setUploadError(null)

    try {
      const blob = await getCroppedBlob(rawImageSrc, croppedAreaPixels)
      const formData = new FormData()
      formData.append('type', 'roster')
      formData.append('rosterId', rosterId)
      formData.append('image', blob, 'portrait.jpg')

      const res = await fetch(`/api/rosters/${rosterId}/portrait`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      toast.success('Portrait uploaded!')
      setRawImageSrc(null)
      setCroppedAreaPixels(null)
      roster.hasCustomPortrait = true
      roster.portraitUpdatedAt = new Date()
      onCancel()
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDeletePortrait = async () => {
    setShowDeletePortraitConfirm(false)
    setIsSaving(true)
    try {
      const res = await fetch(`/api/rosters/${rosterId}/portrait`, { method: 'DELETE' })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Delete failed')
      }

      toast.success('Portrait deleted.')
      roster.hasCustomPortrait = false
      roster.portraitUpdatedAt = new Date()
      onCancel()
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Tab Navigation */}
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

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="space-y-1">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4">
            <Label htmlFor="rosterName">Roster Name</Label>
            <Input
              id="rosterName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter roster name"
            />
          </div>
          <div>
            <Label htmlFor="rosterDescription">Description</Label>
            <div className="custom-md-editor">
              <MarkdownEditor
                id="rosterDescription"
                value={description}
                onChange={(val) => setDescription(val || '')}
                style={{ minHeight: 300 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Portrait tab */}
      {activeTab === 'portrait' && (
        <div className="flex flex-col space-y-4">

          {/* Current portrait */}
          {hasCustomPortrait && !rawImageSrc && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5>Current Portrait</h5>
                <Button
                  variant="ghost"
                  className="text-destructive border-destructive hover:text-destructive"
                  onClick={() => setShowDeletePortraitConfirm(true)}
                  disabled={isSaving}
                >
                  <h6>Delete</h6>
                </Button>
              </div>
              <img
                src={`${getRosterPortraitUrl(rosterId)}?v=${toEpochMs(roster.portraitUpdatedAt)}`}
                alt="Current portrait"
                className="rounded border border-border w-full object-cover"
                style={{ aspectRatio: '3/2', maxWidth: 400 }}
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          {/* Upload / cropper */}
          <div>
            <h5>{hasCustomPortrait ? 'Replace Portrait' : 'Upload Portrait'}</h5>

            {rawImageSrc ? (
              <div className="mt-2 flex flex-col gap-2">
                <PortraitCropper
                  imageSrc={rawImageSrc}
                  onCropComplete={setCroppedAreaPixels}
                />
                <div className="flex items-center justify-between">
                  <button
                    className="text-xs text-muted underline"
                    onClick={() => { setRawImageSrc(null); setCroppedAreaPixels(null) }}
                  >
                    Choose different image
                  </button>
                  {isSaving && <span className="text-xs text-muted">Saving…</span>}
                </div>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortraitChange}
                  className="mt-2"
                />
                <p className="text-xs text-muted mt-2">
                  To be considered for the Roster Spotlight, each operative portrait must be a photo of its painted mini,
                  and the roster portrait must be a photo of all painted minis together.
                  Qualifying rosters appear in the "Rosters" tab for their Killteam and are randomly shown on the homepage.
                </p>
              </>
            )}
          </div>

          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirmPortrait && (
        <Modal
          title="Delete Portrait"
          onClose={() => setShowDeletePortraitConfirm(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeletePortraitConfirm(false)}>
                <h6>Cancel</h6>
              </Button>
              <Button onClick={handleConfirmDeletePortrait}>
                <h6>Delete</h6>
              </Button>
            </div>
          }
        >
          Are you sure you want to delete this roster's portrait? This action cannot be undone.
        </Modal>
      )}
    </>
  )
})

export default EditRosterForm
