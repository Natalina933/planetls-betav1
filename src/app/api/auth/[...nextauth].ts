// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { compare } from "bcryptjs";

type UserRecord = {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar_url?: string | null;
  role: string;
};
type UserSafe = Omit<UserRecord, "password">;

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.error("Erreur config Supabase");
          return null;
        }

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Récupération utilisateur (incluant le hash)
        const { data: userRecord } = await supabase
          .from("users")
          .select("id, username, email, password, avatar_url, role")
          .eq("email", credentials.email)
          .maybeSingle<UserRecord>();

        if (!userRecord) return null;

        // 2. Vérification mot de passe
        const isValid = await compare(credentials.password, userRecord.password);
        if (!isValid) return null;

        // 3. Renvoi des infos publiques
        const { id, username, email, avatar_url, role } = userRecord;
        const safeUser: UserSafe = { id, username, email, avatar_url, role };
        return safeUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST };
