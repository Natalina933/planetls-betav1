// src/app/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ✅ Liste blanche des rôles valides (Pour référence et typage)
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] → Authorize called with:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.warn("[AUTH] ✖ Missing credentials");
          return null;
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey); // 🔹 Authentification Supabase

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData.user) {
          console.error(
            "[AUTH] ✖ Supabase sign-in failed:",
            authError?.message
          );
          return null;
        }

        const userId = authData.user.id;
        console.log("[AUTH] ✓ Supabase user authenticated. ID:", userId); // ⚠️ PATCH TEMPORAIRE : Délai pour éviter le problème de timing/réplication // Supprimez cette ligne si votre problème est résolu après quelques tests.

        // ====================================================================
        // 🛑 Augmenter la temporisation à 1500ms (1.5s)
        console.log(
          "[AUTH] ⏳ Waiting 500ms for profile insertion to complete..."
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        // MODIFIÉ DE 500 À 1500 // ==================================================================== // 🔹 Récupération du profil
        const MAX_RETRIES = 5;
        const INITIAL_DELAY_MS = 300;
        let profile = null;
        let profileError = null;

        for (let i = 0; i < MAX_RETRIES; i++) {
          // 🔹 Tentative de récupération du profil
          ({ data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle());

          console.log(
            `[AUTH] Attempt ${i + 1}/${MAX_RETRIES} to fetch profile. Error: ${
              profileError ? "Yes" : "No"
            }. Profile Found: ${!!profile}`
          );

          if (profile) {
            break; // Le profil est trouvé, on sort de la boucle
          }

          if (i < MAX_RETRIES - 1) {
            // Attente exponentielle entre les tentatives (300ms, 600ms, 1200ms...)
            const delayMs = INITIAL_DELAY_MS * Math.pow(2, i);
            console.log(
              `[AUTH] Profile not found yet, waiting ${delayMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        console.log(`[AUTH] Query finished for ID: ${userId}`);
        console.log("[AUTH] profileError after query:", profileError);
        console.log("[AUTH] profile after query:", profile);

        if (profileError) {
          console.error(
            "[AUTH] ✖ Error fetching profile (Supabase error):",
            profileError.message
          );
          return null;
        }
        if (!profile) {
          console.error(
            `[AUTH] ✖ CRITICAL: No profile row found in 'profiles' for ID: ${userId}`
          );
          return null; // Le profil doit exister pour créer une session
        } // 🔹 Validation du rôle (Utilise 'profile.role', comme inséré par l'API register) // Si 'role' est null, on utilise 'owner' comme fallback.

        const roleValue = profile.role ?? "owner";
        const normalizedRole: UserRole = VALID_ROLES.includes(
          roleValue as UserRole
        )
          ? (roleValue as UserRole)
          : "owner"; // 🔹 Construction du nom complet

        const fullName =
          profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || profile.last_name || ""; // 🔹 Gestion avatar

        const avatar = profile.avatar_url ?? null;

        console.log("[AUTH] ✓ Profile loaded. Final Role:", normalizedRole); // ✅ Retourne l'utilisateur pour NextAuth

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
    }), // 🔹 Authentification Google

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Les callbacks restent les mêmes car le rôle est déjà correct dans l'objet 'user'
    async jwt({ token, user }) {
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
        token.location = user.location ?? null;
        token.option = user.option ?? null;
        token.search_target = user.search_target ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.phone = token.phone as string | null;
        session.user.role = token.role as UserRole;
        session.user.avatar_url = token.avatar_url as string | null;
        session.user.location = token.location as string | null;
        session.user.option = token.option as string | null;
        session.user.search_target = token.search_target as string | null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};
