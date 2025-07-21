'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiList, FiLogIn, FiTool, FiUsers } from 'react-icons/fi'

export default function NavBarBottom() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userName = session?.user?.userName

  const links = [
    {
      href: '/',
      icon: <FiHome />,
      label: 'Home',
      show: true,
      match: (path: string) => path === '/',
    },
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
    <nav className="noprint lg:hidden fixed bottom-0 inset-x-0 bg-black border-t border-border flex justify-around items-center py-2 z-50">
      {links
        .filter((link) => link.show)
        .map((link) => {
          const isActive = link.match(pathname)

          return (
            <Link key={link.href} href={link.href} prefetch={true} className="flex flex-col items-center text-xs text-muted">
              <h4 className={`font-heading ${isActive ? 'text-main' : ''}`}>
                {link.icon}
              </h4>
              <span className={`font-heading ${isActive ? 'text-main' : ''}`} style={{textTransform: 'uppercase'}}>{link.label}</span>
            </Link>
          )
        })}
    </nav>
  )
}
