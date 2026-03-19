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

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const sessionMaxAgeSeconds = 60 * 60 * 8;

// Type for our custom user fields passed through JWT
interface CustomUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  username: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  location: string | null;
  option: string | null;
  search_target: string | null;
  company_name: string | null;
  status: string;
}

const providers: NextAuthConfig["providers"] = [
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

        const profileStatus = (profile as { status?: string | null }).status ?? null;

        if (profileStatus === "suspended" || profileStatus === "deleted") {
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
          username: profile.username || null,
          name: fullName,
          firstName: profile.first_name || null,
          lastName: profile.last_name || null,
          phone: profile.phone || null,
          role,
          avatar_url: profile.avatar_url || null,
          location: profile.location || null,
          option: profile.option || null,
          search_target: profile.search_target || null,
          company_name: profile.company_name || null,
          status: profileStatus ?? "active",
        } satisfies CustomUser;
      } catch (error) {
        console.error("[AUTH] Authorize error:", error);
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authOptions: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: sessionMaxAgeSeconds, updateAge: 60 * 30 },
  jwt: { maxAge: sessionMaxAgeSeconds },
  useSecureCookies: isProduction,
  providers,
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as CustomUser;
        token.id = u.id;
        token.email = u.email;
        token.emailVerified = u.emailVerified;
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
        username: (token.username as string | null) ?? null,
        name: (token.name as string) || "",
        avatar_url: (token.avatar_url as string) || null,
        role: (token.role as UserRole) || "owner",
        status: (token.status as string) || "active",
        firstName: (token.firstName as string | null) ?? null,
        lastName: (token.lastName as string | null) ?? null,
        phone: (token.phone as string) || null,
        location: (token.location as string) || null,
        option: (token.option as string) || null,
        search_target: (token.search_target as string) || null,
        company_name: (token.company_name as string | null) ?? null,
      };

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: authSecret,
  trustHost: true,
};

export const { handlers, auth } = NextAuth(authOptions);
