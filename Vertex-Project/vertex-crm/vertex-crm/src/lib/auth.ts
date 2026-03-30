import { NextAuthOptions, Account, User } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { JWT } from 'next-auth/jwt'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/spreadsheets',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null; user?: User }) {
      if (account) {
        token.accessToken  = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt    = account.expires_at
      }

      const now = Math.floor(Date.now() / 1000)
      if (token.expiresAt && now < (token.expiresAt as number) - 300) {
        return token
      }

      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id:     process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type:    'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        })
        const refreshed = await res.json()
        if (!res.ok) throw refreshed
        return {
          ...token,
          accessToken: refreshed.access_token,
          expiresAt:   Math.floor(Date.now() / 1000) + refreshed.expires_in,
        }
      } catch (err) {
        console.error('[NextAuth] Token refresh failed:', err)
        return { ...token, error: 'RefreshAccessTokenError' }
      }
    },

    async session({ session, token }) {
      session.accessToken  = token.accessToken  as string
      session.refreshToken = token.refreshToken as string
      session.error        = token.error        as string | undefined
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  session: { strategy: 'jwt' },
}
