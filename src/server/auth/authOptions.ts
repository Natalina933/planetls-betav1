import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/types/supabase";
import { resolveUserRole } from "@/app/utils/roles";
import { logAuthDebug } from "@/server/logging/authDebug";
import { resolveDevWorkspaceAccount } from "@/server/auth/devWorkspace";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "build-time-placeholder-service-role-key",
);

const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const sessionMaxAgeSeconds = 60 * 60 * 8;

const maskEmail = (email: string | null | undefined): string => {
  if (!email) {
    return "unknown";
  }

  const [localPart = "", domainPart = ""] = email.split("@");
  if (!localPart || !domainPart) {
    return email;
  }

  const visibleLocal =
    localPart.length <= 2
      ? `${localPart.charAt(0)}*`
      : `${localPart.slice(0, 2)}***`;
  return `${visibleLocal}@${domainPart}`;
};

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
          logAuthDebug("[NextAuth][credentials] missing credentials");
          return null;
        }

        logAuthDebug("[NextAuth][credentials] authorize start", {
          email: maskEmail(String(credentials.email)),
        });

        const { data: authData, error } =
          await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

        if (error || !authData.user) {
          const devWorkspaceAccount = resolveDevWorkspaceAccount(
            String(credentials.email),
            String(credentials.password),
          );

          if (devWorkspaceAccount) {
            logAuthDebug("[NextAuth][credentials] dev workspace fallback", {
              email: maskEmail(String(credentials.email)),
              role: devWorkspaceAccount.role,
            });
            return devWorkspaceAccount satisfies CustomUser;
          }

          logAuthDebug("[NextAuth][credentials] Supabase auth rejected", {
            email: maskEmail(String(credentials.email)),
            error: error?.message ?? "unknown",
          });
          return null;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !profile) {
          console.error("[NextAuth][credentials] profile lookup failed", {
            userId: authData.user.id,
            error: profileError?.message ?? "profile_not_found",
          });
          return null;
        }

        if (profile.status === "suspended" || profile.status === "deleted") {
          logAuthDebug("[NextAuth][credentials] profile status blocked", {
            userId: profile.id,
            status: profile.status,
          });
          return null;
        }

        const role: UserRole =
          resolveUserRole(profile.role, profile.category) ?? "owner";
        const fullName =
          profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || profile.last_name || "";

        return {
          id: profile.id,
          email: profile.email,
          emailVerified: profile.email_confirmed_at
            ? new Date(profile.email_confirmed_at)
            : null,
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
          status: profile.status ?? "active",
        } satisfies CustomUser;
      } catch (error) {
        const devWorkspaceAccount = resolveDevWorkspaceAccount(
          String(credentials?.email ?? ""),
          String(credentials?.password ?? ""),
        );

        if (devWorkspaceAccount) {
          logAuthDebug("[NextAuth][credentials] dev workspace fallback after exception", {
            email: maskEmail(String(credentials?.email ?? "")),
            role: devWorkspaceAccount.role,
          });
          return devWorkspaceAccount satisfies CustomUser;
        }

        console.error("[NextAuth][credentials] authorize exception", error);
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
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAgeSeconds,
    updateAge: 60 * 30,
  },
  jwt: { maxAge: sessionMaxAgeSeconds },
  useSecureCookies: isProduction,
  providers,
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
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
        const currentUser = user as CustomUser;
        token.id = currentUser.id;
        token.email = currentUser.email;
        token.emailVerified = currentUser.emailVerified;
        token.username = currentUser.username;
        token.name = currentUser.name;
        token.avatar_url = currentUser.avatar_url;
        token.role = currentUser.role;
        token.status = currentUser.status;
        token.firstName = currentUser.firstName;
        token.lastName = currentUser.lastName;
        token.phone = currentUser.phone;
        token.location = currentUser.location;
        token.option = currentUser.option;
        token.search_target = currentUser.search_target;
        token.company_name = currentUser.company_name;
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
