import NewsPopup from '@/components/home/NewsPopup'
import NavBarBottom from '@/components/nav/NavBarBottom'
import NavBarTop from '@/components/nav/NavBarTop'
import ServiceWorkerRegister from '@/components/tools/ServiceWorkerRegister'
import { ClientProviders } from '@/components/ui/ClientProviders'
import { authOptions } from '@/lib/auth'
import '@/src/styles/globals.css'
import { GoogleAnalytics } from '@next/third-parties/google'
import { getServerSession } from 'next-auth'
import Script from 'next/script'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b3441b" />
        <link rel="icon" href="/icons/icon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/icons/icon-16x16.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      </head>

      <body className="text-foreground font-main" suppressHydrationWarning>
        <Script id="font-init" strategy="afterInteractive">
          {`
            try {
              var raw = window.localStorage.getItem('settings');
              var parsed = raw ? JSON.parse(raw) : null;
              var font = (parsed && parsed.fontFamily) ? parsed.fontFamily : 'oswald';
              document.body.setAttribute('data-font', font);
            } catch (e) {
              document.body.setAttribute('data-font', 'oswald');
            }
          `}
        </Script>
        {/* suppressHydrationWarning is scoped only to <body>'s own attributes, not its descendants.
            It is intentional here: the font-init script sets data-font before React hydrates,
            causing a known attribute mismatch that we accept. */}
        <ClientProviders session={session}>
          <NavBarTop />
          <main className="pb-16 lg:pb-0">{children}</main>
          <NewsPopup />
          <NavBarBottom />
        </ClientProviders>
        <ServiceWorkerRegister />
        <GoogleAnalytics gaId="G-Q584HL6VDV" />
      </body>
    </html>
  )
}
