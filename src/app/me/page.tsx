import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserPage, { generateMetadata as generateUserMetadata } from '../users/[userName]/page'

// Rendered directly rather than rewritten in proxy.ts: behind a reverse proxy, a
// middleware rewrite's origin can mismatch Next's internal URL and get treated as external
async function getCurrentUserName() {
  const session = await getAuthSession()
  if (!session?.user?.userName) redirect('/auth/login')
  return session.user.userName
}

export async function generateMetadata() {
  const userName = await getCurrentUserName()
  return generateUserMetadata({ params: Promise.resolve({ userName }) })
}

export default async function MePage() {
  const userName = await getCurrentUserName()
  return <UserPage params={Promise.resolve({ userName })} />
}
