// apps/web/app/api/auth/[...nextauth]/route.ts
// ⚠️ UPDATED FOR RBAC MIGRATION - Phase 1

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@safetyquest/database';
import { verifyPassword } from '@safetyquest/shared';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email;
        const password = credentials.password;

        // ✅ NEW: Include roleModel with permissions in user query
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            roleModel: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        // ✅ NEW: Transform permissions into session-friendly format
        const permissions = user.roleModel?.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action
        })) || [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // ⚠️ Legacy field - kept for backward compatibility
          roleId: user.roleId,
          roleModel: user.roleModel ? {
            id: user.roleModel.id,
            name: user.roleModel.name,
            slug: user.roleModel.slug,
            permissions
          } : null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // ✅ Include both legacy and new RBAC data
        token.role = user.role; // Legacy
        token.roleId = user.roleId;
        token.roleModel = user.roleModel;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string; // Legacy
        session.user.roleId = token.roleId as string;
        session.user.roleModel = token.roleModel as any;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };