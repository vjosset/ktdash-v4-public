// lib/trackEvent.ts

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export async function trackEvent(
  t: string = '',
  a: string = '',
  l: string = '',
  v1: string = '',
  v2: string = '',
  v3: string = '',
  r?: string
) {
  try {
    const body = {
      t,
      a,
      l,
      v1,
      v2,
      v3,
      u: window.location.href,
      s: sessionStorage.getItem('sessiontype') ?? '',
      r: r ?? document.referrer,
    }

    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('trackEvent() failed:', err)
  }
}
