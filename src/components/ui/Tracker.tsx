'use client'

import { trackEvent } from '@/lib/utils/trackEvent'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function Tracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    trackEvent('page', 'view')

  }, [pathname, searchParams])

  return null
}
