// src/app/lib/authOptions.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/types/supabase";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
] as const;

// Type for our custom user fields passed through JWT
interface CustomUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  location: string | null;
  option: string | null;
  search_target: string | null;
  company_name: string;
  status: string;
}

export const authOptions: NextAuthConfig = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials.password) {
            console.warn("[AUTH] Missing email or password");
            return null;
          }

          const { data: authData, error } =
            await supabase.auth.signInWithPassword({
              email: credentials.email as string,
              password: credentials.password as string,
            });

          if (error || !authData.user) {
            console.warn("[AUTH] Supabase login failed:", error?.message);
            return null;
          }

          const userId = authData.user.id;

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (profileError || !profile) {
            console.warn("[AUTH] Profile missing:", profileError?.message);
            return null;
          }

          if (profile.status === "suspended" || profile.status === "deleted") {
            console.warn(`[AUTH] User suspended or deleted: ${userId}`);
            return null;
          }

          const role: UserRole = VALID_ROLES.includes(profile.role)
            ? profile.role
            : "owner";

          const fullName =
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.first_name || profile.last_name || "";

          return {
            id: profile.id,
            email: profile.email,
            emailVerified: profile.email_confirmed_at ? new Date(profile.email_confirmed_at) : null,
            username: profile.username || "",
            name: fullName,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            phone: profile.phone || null,
            role,
            avatar_url: profile.avatar_url || null,
            location: profile.location || null,
            option: profile.option || null,
            search_target: profile.search_target || null,
            company_name: profile.company_name || "",
            status: profile.status ?? "active",
          } satisfies CustomUser;
        } catch (error) {
          console.error("[AUTH] Authorize error:", error);
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as CustomUser;
        token.id = u.id;
        token.email = u.email;
        token.username = u.username;
        token.name = u.name;
        token.avatar_url = u.avatar_url;
        token.role = u.role;
        token.status = u.status;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.phone = u.phone;
        token.location = u.location;
        token.option = u.option;
        token.search_target = u.search_target;
        token.company_name = u.company_name;
      }
      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user = {
        id: (token.id as string) || "",
        email: (token.email as string) || "",
        emailVerified: (token.emailVerified as Date | null) ?? null,
        username: (token.username as string) || "",
        name: (token.name as string) || "",
        avatar_url: (token.avatar_url as string) || null,
        role: (token.role as UserRole) || "owner",
        status: (token.status as string) || "active",
        firstName: (token.firstName as string) || "",
        lastName: (token.lastName as string) || "",
        phone: (token.phone as string) || null,
        location: (token.location as string) || null,
        option: (token.option as string) || null,
        search_target: (token.search_target as string) || null,
        company_name: (token.company_name as string) || "",
      };

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers } = NextAuth(authOptions);