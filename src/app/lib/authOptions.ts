// src/app/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/supabase"; // adapte le chemin !
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          return null;
        }

        // Récupère le profil depuis la table profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, name, type, email, avatarurl, photo")
          .eq("id", data.user.id)
          .maybeSingle();

        // Sélection du champ avatar selon le nom réel de ta colonne
        const avatar = profile?.avatarurl ?? profile?.photo ?? null;

        // Retourne une structure NextAuth User conforme
        return {
          id: data.user.id,
          email: data.user.email ?? "",
          username: profile?.username ?? "",
          name: profile?.name ?? "",
          role: (profile?.type as UserRole) ?? "user",
          avatar_url: avatar,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;
        token.role = user.role;
        token.avatar_url = user.avatar_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.avatar_url = token.avatar_url;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};
