'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/utils/trackEvent'

export function Tracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    const url = pathname + searchParams.toString()

    window.gtag?.('config', 'G-XXXXXXXXXX', {
      page_path: url,
    })

    trackEvent('page', 'view')

  }, [pathname, searchParams])

  return null
}
