import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function UsersIndexPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.userName) {
    // Optionally: redirect to login or show a message
    redirect('/auth/login') // or show a 404 / error
  }

  redirect('/me')
}
