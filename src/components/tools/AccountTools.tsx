'use client'

import { Button, Input, Modal, SectionTitle } from '@/components/ui'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AccountTools() {
  const { status, data: session } = useSession()
  
  const [showConfirmLogOut, setShowConfirmLogOut] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updatePassword = () => {
    if (!session?.user) {
      toast.error('Please log in before updating your password.')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    const res = fetch(`/api/users/${session?.user?.userName}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }).then((res) => {if (res.ok) {
      toast.success('Password updated')
    } else {
      toast.error('Could not update password')
    }
    });
  }

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
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)} />
          <Input
            type="password"
            placeholder="Confirm New password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={updatePassword}>
              <h6>Update Password</h6>
            </Button>
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