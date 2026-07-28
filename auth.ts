import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Role } from "@prisma/client";

import { AuthService } from "@/lib/services/auth-service";
import { loginSchema } from "@/lib/validation/auth";

function isRole(value: unknown): value is Role {
  return value === Role.ADMIN || value === Role.CANDIDATE || value === Role.REFERRER;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        return AuthService.verifyCredentials(parsed.data);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        if (typeof user.id === "string") {
          token.id = user.id;
        }

        if (isRole(user.role)) {
          token.role = user.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string" && isRole(token.role)) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
