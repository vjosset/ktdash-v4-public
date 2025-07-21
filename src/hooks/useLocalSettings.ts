'use client'

import { useEffect, useState } from 'react'

interface LocalSettings {
  showPortraits: boolean
  showNarrative: boolean // Deprecated, not in use
  theme: 'light' | 'dark'
}

const DEFAULT_SETTINGS: LocalSettings = {
  showPortraits: true,
  showNarrative: false,
  theme: 'dark'
}

export function useLocalSettings() {
  const [settings, setSettings] = useState<LocalSettings>(() => {
    // Initialize with saved settings if they exist
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return DEFAULT_SETTINGS
  })

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<LocalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return { settings, updateSettings }
}
