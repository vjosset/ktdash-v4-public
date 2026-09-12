'use client'

import AdminTools from '@/components/tools/AdminTools'
import Resources from '@/components/tools/Resources'
import SettingsForm from '@/components/tools/SettingsForm'
import PageTitle from '@/components/ui/PageTitle'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ToolsPageClient() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const validTabs = ['settings', 'resources', 'admin'] as const
  type Tab = typeof validTabs[number]
  const defaultTab: Tab = 'settings'

  const tabParam = searchParams.get('tab') as Tab | null
  const tab: Tab = validTabs.includes(tabParam as Tab) ? (tabParam as Tab) : defaultTab

  const changeTab = (nextTab: Tab) => {
  const params = new URLSearchParams(searchParams)
    if (nextTab === defaultTab) {
      params.delete('tab')
    } else {
      params.set('tab', nextTab)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const tabClasses = (selected: boolean) =>
    clsx(
      'px-4 py-2 border-b-2 transition-colors',
      selected
        ? 'border-main text-main'
        : 'border-transparent text-muted hover:text-foreground'
    )

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="px-1 pt-8 max-w-6xl mx-auto">
      <div className="text-center">
        <PageTitle>Tools</PageTitle>

        <div className="w-full">
          <div className="flex justify-center space-x-4 border-b border-border">
            <button className={tabClasses(tab === 'settings')} onClick={() => changeTab('settings')}>
              Settings
            </button>
            <button className={tabClasses(tab === 'resources')} onClick={() => changeTab('resources')}>
              Resources
            </button>
            {session?.user?.userId === 'vince' && (
              <button className={tabClasses(tab === 'admin')} onClick={() => changeTab('admin')}>
                Admin
              </button>
            )}
          </div>

          <div className="leading-relaxed overflow-y-auto px-2 text-left">
            <div className={'w-full max-w-md mx-auto ' + (tab === 'settings' ? 'block' : 'hidden')}>
              <SettingsForm />
            </div>
            <div className={'w-full max-w-md mx-auto ' + (tab === 'resources' ? 'block' : 'hidden')}>
              <Resources />
            </div>
            {/* Wider than the other two: the admin tab carries stat tables and match rows,
                not the narrow forms that Settings and Resources are built around */}
            {session?.user?.userId === 'vince' && (
              <div className={'w-full max-w-3xl mx-auto ' + (tab === 'admin' ? 'block' : 'hidden')}>
                <AdminTools />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
