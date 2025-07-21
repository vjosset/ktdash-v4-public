'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/' // Explicitly set scope to root
        })
        .then((registration) => {
          console.log('SW registered with scope:', registration.scope)
        })
        .catch((err) => console.error('Service Worker registration failed:', err))
    }
  }, [])

  return null
}
