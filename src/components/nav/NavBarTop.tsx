'use client'

import { GAME } from '@/lib/config/game_config'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiList, FiLogIn, FiTool, FiUsers } from 'react-icons/fi'

export default function NavBarTop() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userName = session?.user?.userName


  const links = [
    {
      href: '/killteams',
      icon: <FiList />,
      label: 'Killteams',
      show: true,
      match: (path: string) => path.includes('/factions') || path.includes('/killteams'),
    },
    {
      href: '/me',
      icon: <FiUsers />,
      label: 'Rosters',
      show: !!userName,
      match: (path: string) =>
        path.includes('/me') || path.includes('/users') || path.includes('/rosters'),
    },
    {
      href: '/auth/login',
      icon: <FiLogIn />,
      label: 'Log In',
      show: !userName,
      match: (path: string) => path === '/auth/login',
    },
    //{
    //  href: '/auth/signup',
    //  icon: <FiUserPlus />,
    //  label: 'Sign Up',
    //  show: !userName,
    //  match: (path: string) => path === '/auth/signup',
    //},
    {
      href: '/tools',
      icon: <FiTool />,
      label: 'Tools',
      show: true,
      match: (path: string) => path === '/tools',
    },
  ]

  return (
    <nav className="noprint hidden lg:flex sticky top-0 z-50 justify-between items-center px-6 py-3 bg-black text-foreground border-b border-border">
      <Link href="/" className="flex items-center space-x-2">
        <img src="/icons/icon-big.png" className="h-10" />
        <h1 className="title text-3xl glowtext">
          {GAME.NAME}
        </h1>
      </Link>

      <div className="flex gap-6 items-center">
        {links
          .filter((link) => link.show)
          .map((link) => {
            const isActive = link.match(pathname)

            return (
              <Link key={link.href} prefetch={true} href={link.href} className="flex flex-col items-center text-xs text-muted">
                <h4 className={`font-heading ${isActive ? 'text-main' : ''}`}>
                  {link.icon}
                </h4>
                <span className={`font-heading ${isActive ? 'text-main' : ''}`} style={{textTransform: 'uppercase'}}>{link.label}</span>
              </Link>
            )
          })}
      </div>
    </nav>
  )
}
