'use client'

import { Input, Label } from '@/components/ui'
import { forwardRef, useImperativeHandle, useState } from 'react'

export interface EditRosterFormRef {
  handleSubmit: () => void
}

const EditRosterForm = forwardRef(function EditRosterForm(
  {
    initialName,
    onSubmit,
  }: {
    initialName: string
    onSubmit: (name: string) => void
    onCancel: () => void
  },
  ref
) {
  const [name, setName] = useState(initialName)

  // Add useImperativeHandle to expose handleSubmit
  useImperativeHandle(ref, () => ({
    handleSubmit: () => onSubmit(name)
  }))

  return (
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
    </div>
  )
})

export default EditRosterForm
