// src/app/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Liste blanche des rôles valides
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
  providers: [
    // ============================================================
    // 🔹 Credentials Provider
    // ============================================================
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        console.log("[AUTH] → Authorize with:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.warn("[AUTH] ✖ Missing credentials");
          return null;
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData.user) {
          console.error("[AUTH] ✖ Sign-in failed:", authError?.message);
          return null;
        }

        const userId = authData.user.id;
        console.log("[AUTH] ✓ Supabase authenticated:", userId);

        // 🔄 Attente courte si la ligne "profiles" n'est peut-être pas encore créée
        console.log("[AUTH] ⏳ Waiting 500ms...");
        await new Promise((resolve) => setTimeout(resolve, 500));

        // ============================================================
        // 🔄 Récupération du profil avec retry (évite erreurs)
        // ============================================================
        const MAX_RETRIES = 5;
        const INITIAL_DELAY_MS = 300;
        let profile = null;
        let profileError = null;

        for (let i = 0; i < MAX_RETRIES; i++) {
          const result = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

          profile = result.data;
          profileError = result.error;

          console.log(
            `[AUTH] Fetch profile try ${
              i + 1
            }/${MAX_RETRIES} — Found: ${!!profile}`
          );

          if (profile) break;

          if (i < MAX_RETRIES - 1) {
            const delay = INITIAL_DELAY_MS * Math.pow(2, i);
            console.log(`[AUTH] Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        if (profileError) {
          console.error("[AUTH] ✖ Profile fetch error:", profileError.message);
          return null;
        }

        if (!profile) {
          console.error("[AUTH] ✖ No profile found for:", userId);
          return null;
        }

        // ============================================================
        // 🔎 Normalisation du rôle
        // ============================================================
        const roleValue = profile.role ?? "owner";

        const normalizedRole: UserRole = VALID_ROLES.includes(
          roleValue as UserRole
        )
          ? (roleValue as UserRole)
          : "owner";

        // ============================================================
        // 👤 Nom complet
        // ============================================================
        const fullName =
          profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || profile.last_name || "";

        // ============================================================
        // 🖼 Avatar
        // ============================================================
        const avatar = profile.avatar_url ?? null;

        // ============================================================
        // ↩ Retour à NextAuth
        // ============================================================
        return {
          id: profile.id,
          email: profile.email ?? authData.user.email ?? "",
          username: profile.username ?? "",
          name: fullName,
          firstName: profile.first_name ?? null,
          lastName: profile.last_name ?? null,
          phone: profile.phone ?? null,
          role: normalizedRole,
          avatar_url: avatar,
          location: profile.location ?? null,
          option: profile.option ?? null,
          search_target: profile.search_target ?? null,
        };
      },
    }),

    // ============================================================
    // 🔹 Google Provider
    // ============================================================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // ============================================================
  // 🔹 Sessions JWT
  // ============================================================
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 🔹 Connexion initiale : copier toutes les données user dans le token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
        token.role = user.role;
        token.avatar_url = user.avatar_url;
        token.location = user.location;
        token.option = user.option;
        token.search_target = user.search_target;
      }

      // 🔥 Mise à jour manuelle via update()
      if (trigger === "update" && session?.user) {
        console.log(
          "[JWT] 🔄 Update triggered with avatar:",
          session.user.avatar_url
        );

        // Mettre à jour tous les champs envoyés
        if (session.user.avatar_url !== undefined) {
          token.avatar_url = session.user.avatar_url;
        }
        if (session.user.firstName !== undefined) {
          token.firstName = session.user.firstName;
        }
        if (session.user.lastName !== undefined) {
          token.lastName = session.user.lastName;
        }
        if (session.user.name !== undefined) {
          token.name = session.user.name;
        }
        if (session.user.username !== undefined) {
          token.username = session.user.username;
        }
        if (session.user.phone !== undefined) {
          token.phone = session.user.phone;
        }
        if (session.user.location !== undefined) {
          token.location = session.user.location;
        }
        if (session.user.option !== undefined) {
          token.option = session.user.option;
        }
        if (session.user.search_target !== undefined) {
          token.search_target = session.user.search_target;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Copier toutes les données du token dans session.user
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.name = token.name;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.phone = token.phone;
      session.user.role = token.role;
      session.user.avatar_url = token.avatar_url;
      session.user.location = token.location;
      session.user.option = token.option;
      session.user.search_target = token.search_target;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,

  pages: { signIn: "/login" },
};
