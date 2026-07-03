'use client'

import { trackEvent } from '@/lib/utils/trackEvent'
import { sendGAEvent } from '@next/third-parties/google'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function Tracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!pathname) return

    trackEvent('page', 'view')

    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    sendGAEvent('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    })

  }, [pathname, searchParams])

  return null
}
