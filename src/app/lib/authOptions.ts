// src/app/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/types/supabase";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_ROLES: UserRole[] = [
  "owner",
  "owner_pro",
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
  "admin",
  "super_admin",
];

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    // ============================================================
    // 🔐 Credentials
    // ============================================================
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // 1️⃣ Auth Supabase
        const { data: authData, error } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (error || !authData.user) {
          console.error("[AUTH] Supabase login failed:", error?.message);
          return null;
        }

        const userId = authData.user.id;

        // 2️⃣ Profil DOIT exister
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          console.error("[AUTH] Profile missing:", profileError?.message);
          return null;
        }

        // 3️⃣ Normalisation rôle
        const role: UserRole = VALID_ROLES.includes(profile.role)
          ? profile.role
          : "owner";

        const fullName =
          profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || profile.last_name || "";

        // 4️⃣ Retour user NextAuth
        return {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          name: fullName,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          role,
          avatar_url: profile.avatar_url,
          location: profile.location,
          option: profile.option,
          search_target: profile.search_target,
          company_name: profile.company_name,
          status: profile.status ?? "active",
        };
      },
    }),

    // ============================================================
    // 🔐 Google
    // ============================================================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // ============================================================
    // 🔑 JWT
    // ============================================================
    async jwt({ token, user }) {
      if (user) {
        Object.assign(token, user);
      }
      return token;
    },

    // ============================================================
    // 👤 Session
    // ============================================================
   async session({ session, token }) {
  session.user = {
    id: token.id,
    email: token.email,
    username: token.username,
    name: token.name,
    avatar_url: token.avatar_url,
    role: token.role,
    status: token.status,
    firstName: token.firstName,
    lastName: token.lastName,
    phone: token.phone,
    location: token.location,
    option: token.option,
    search_target: token.search_target,
    company_name: token.company_name,
  };

  return session;
}

  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
