import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Handle /me → /users/:userName
  if (pathname === '/me') {
    const token = await getToken({ req })

    if (token?.userName) {
      const url = req.nextUrl.clone()
      url.pathname = `/users/${token.userName}`
      return NextResponse.rewrite(url)
    } else {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  // Handle /rosters/:id/gallery → /rosters/:id?gallery=1
  const match = pathname.match(/^\/rosters\/([^/]+)\/gallery$/)
  if (match) {
    const rosterId = match[1]
    const url = req.nextUrl.clone()
    url.pathname = `/rosters/${rosterId}`
    url.searchParams.set('tab', 'gallery')
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/me', '/rosters/:path*/gallery'],
}
