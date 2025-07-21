import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only rewrite for /me route
  if (pathname === '/me') {
    const token = await getToken({ req })

    if (token?.userName) {
      const url = req.nextUrl.clone()
      url.pathname = `/users/${token.userName}`
      return NextResponse.rewrite(url)
    } else {
      // Optionally redirect to login if not authenticated
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}
