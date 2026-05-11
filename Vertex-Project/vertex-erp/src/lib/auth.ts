import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {
  findUserByEmail,
  findRoleById,
  updateUserLastLogin,
  updateUserProfile,
} from './sheets';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const result = await findUserByEmail(user.email);
        if (!result) return false;
        if (result.user.status !== 'active') return false;
        return true;
      } catch (err) {
        console.error('[auth] signIn check failed:', err);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const result = await findUserByEmail(user.email);
          if (result) {
            const role = await findRoleById(result.user.role_id);
            token.dbUserId = result.user.id;
            token.roleId   = result.user.role_id;
            token.role     = role?.role_name ?? 'Unknown';

            await updateUserLastLogin(result.rowIndex, new Date().toISOString());

            if (!result.user.full_name && user.name) {
              await updateUserProfile(
                result.rowIndex,
                user.name,
                user.image ?? '',
              );
            }
          } else {
            token.dbUserId = '';
            token.roleId   = '';
            token.role     = 'Unknown';
          }
        } catch (err) {
          console.error('[auth] jwt role fetch failed:', err);
          token.dbUserId = '';
          token.roleId   = '';
          token.role     = 'Unknown';
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.sub as string;
        session.user.role     = (token.role     as string) ?? 'Unknown';
        session.user.roleId   = (token.roleId   as string) ?? '';
        session.user.dbUserId = (token.dbUserId as string) ?? '';
      }
      return session;
    },
  },
});
