'use client'

import { useEffect, useState } from 'react'

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  UserSettings,
  getSettings,
  resetSettings,
  setSetting,
  setSettings
} from '@/lib/settings'

type SettingsUpdater =
  | Partial<UserSettings>
  | ((current: UserSettings) => Partial<UserSettings>)

export function useLocalSettings() {
  // Start with defaults so SSR/CSR markup stays in sync; hydrate real settings on mount
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load persisted settings once the browser environment is available
    setSettingsState(getSettings())

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SETTINGS_STORAGE_KEY) {
        setSettingsState(getSettings())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.setAttribute('data-font', settings.fontFamily)
  }, [settings.fontFamily])

  const updateSettings = (update: SettingsUpdater) => {
    const next = setSettings(current => ({
      ...current,
      ...(typeof update === 'function' ? update(current) : update)
    }))
    setSettingsState(next)
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const next = setSetting(key, value)
    setSettingsState(next)
  }

  const reset = () => {
    const next = resetSettings()
    setSettingsState(next)
  }

  return { settings, updateSettings, updateSetting, reset, defaults: DEFAULT_SETTINGS }
}
