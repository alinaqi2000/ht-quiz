import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Prisma, no bcrypt, no Node.js-only modules.
// Used by middleware to verify the JWT without hitting the database.
export const authConfig: NextAuthConfig = {
  providers: [], // providers are added in auth.ts (Node.js only)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
