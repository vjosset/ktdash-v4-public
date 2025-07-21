import { NextAuthOptions, getServerSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    userId: string
    userName: string
  }
  interface Session {
    user: User & {
      userId: string
      userName: string
    }
  }
}
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/src/lib/prisma'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userName: { label: 'User Name', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { userName: credentials.userName },
        })
        if (!user) {
          return null
        }

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) {
          return null
        }

        return { id: user.userId, userId: user.userId, userName: user.userName }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.userId = token.userId as string
        session.user.userName = token.userName as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.userId
        token.userId = user.userId
        token.userName = user.userName
      }
      return token
    }
  },
}

export function getAuthSession() {
  return getServerSession(authOptions)
}
