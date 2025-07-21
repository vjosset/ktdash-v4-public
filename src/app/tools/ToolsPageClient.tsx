'use client'

import AccountTools from '@/components/tools/AccountTools'
import AdminTools from '@/components/tools/AdminTools'
import AppVersion from '@/components/tools/AppVersion'
import Resources from '@/components/tools/Resources'
import SettingsForm from '@/components/tools/SettingsForm'
import PageTitle from '@/components/ui/PageTitle'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { useState } from 'react'


export default function ToolsPageClient() {
  const { status, data: session } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  const [tab, setTab] =
    useState<
    'settings' |
    'account' |
    'resources' |
    'admin'
  >('settings')

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-4 py-2 border-b-2 transition-colors',
      selected
        ? 'border-main text-main'
        : 'border-transparent text-muted hover:text-foreground'
    )
    
  return (
    <div className="px-1 py-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <PageTitle>Tools</PageTitle>

        <div className="w-full">
          <div className="flex justify-center space-x-4 border-b border-border mb-4">
            <button className={tabClasses(tab === 'settings')} onClick={() => setTab('settings')}>
              Settings
            </button>
            {session?.user?.userId && (
              <button className={tabClasses(tab === 'account')} onClick={() => setTab('account')}>
                Account
              </button>
            )}
            <button className={tabClasses(tab === 'resources')} onClick={() => setTab('resources')}>
              Resources
            </button>
            {session?.user?.userId == 'vince' && (
              <button className={tabClasses(tab === 'admin')} onClick={() => setTab('admin')}>
                Admin
              </button>
            )}
          </div>
    
          <div className="leading-relaxed max-h-[60vh] overflow-y-auto px-2 text-left">
            <div className={'w-full max-w-md mx-auto ' + (tab === 'settings' ? 'block' : 'hidden')}>
              <SettingsForm />
            </div>
            {session?.user?.userId && (
              <div className={'w-full max-w-md mx-auto ' + (tab === 'account' ? 'block' : 'hidden')}>
                <AccountTools />
              </div>
            )}
            <div className={'w-full max-w-md mx-auto ' + (tab === 'resources' ? 'block' : 'hidden')}>
              <Resources />
            </div>
            {session?.user?.userId == 'vince' && (
              <div className={'w-full max-w-md mx-auto ' + (tab === 'admin' ? 'block' : 'hidden')}>
                <AdminTools />
              </div>
            )}
          </div>
          {/* Version information */}
          <AppVersion />
        </div>
      </div>
    </div>
  )}
