'use client'

import { Button, Input, Modal, SectionTitle } from '@/components/ui'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

export default function AccountTools() {
  const [showConfirmLogOut, setShowConfirmLogOut] = useState(false)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          {/* Log Out */}
          <SectionTitle>Log Out</SectionTitle>
          <Button onClick={() => setShowConfirmLogOut(true)}>
            <h6>Log Out</h6>
          </Button>
        </div>

        {/* Change Password */}
        <hr />
        <div>
          <SectionTitle>Change Password</SectionTitle>
          <Input type="password" placeholder="New password" />
          <Input type="password" placeholder="Confirm New password" />
          <div className="flex justify-end">
            <Button onClick={() => alert('Not implemented')}><h6>Update Password</h6></Button>
          </div>
        </div>
      </div>

      {showConfirmLogOut &&
        <Modal
          title={'Log Out'}
          onClose={() => setShowConfirmLogOut(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowConfirmLogOut(false)}>
                <h6>Cancel</h6>
              </Button>
              <Button onClick={() => signOut({ callbackUrl: '/' })}>
                <h6>Log Out</h6>
              </Button>
            </div>
          }
        >
          <p className="text-sm text-foreground">
            Are you sure you want to log out?
          </p>
        </Modal>
      }
    </>
  )
}