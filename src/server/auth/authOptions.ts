import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
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
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
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

type OAuthProfileInput = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

const cleanOAuthNamePart = (value?: string | null) =>
  value ? value.replace(/[<>]/g, "").trim().slice(0, 50) : "";

const normalizeUsernamePart = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const splitOAuthName = (name?: string | null, email?: string | null) => {
  const parts = cleanOAuthNamePart(name).split(/\s+/).filter(Boolean);
  const emailName = cleanOAuthNamePart(email?.split("@")[0] ?? "Utilisateur");

  return {
    firstName: parts[0] ?? emailName,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "PlanetLS",
  };
};

const buildOAuthUsernameBase = (input: OAuthProfileInput) => {
  const fromName = normalizeUsernamePart(input.name ?? "");
  if (fromName.length >= 3) return fromName.slice(0, 30);

  const fromEmail = normalizeUsernamePart(input.email?.split("@")[0] ?? "");
  if (fromEmail.length >= 3) return fromEmail.slice(0, 30);

  return "utilisateur";
};

const resolveUniqueUsername = async (base: string) => {
  const normalizedBase = normalizeUsernamePart(base).slice(0, 30) || "utilisateur";

  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? "" : `-${index + 1}`;
    const candidateBase =
      suffix.length > 0
        ? normalizedBase.slice(0, Math.max(3, 30 - suffix.length))
        : normalizedBase;
    const candidate = `${candidateBase}${suffix}`.slice(0, 30);
    const { data: existingUser, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!existingUser) return candidate;
  }

  throw new Error("Impossible de generer un nom d'utilisateur unique");
};

const profileToCustomUser = (profile: Record<string, unknown>): CustomUser | null => {
  const role = resolveUserRole(
    typeof profile.role === "string" ? profile.role : null,
    typeof profile.category === "string" ? profile.category : null,
  );

  if (!role) return null;

  const firstName = typeof profile.first_name === "string" ? profile.first_name : "";
  const lastName = typeof profile.last_name === "string" ? profile.last_name : "";
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "";

  return {
    id: String(profile.id ?? ""),
    email: String(profile.email ?? ""),
    emailVerified:
      typeof profile.email_confirmed_at === "string"
        ? new Date(profile.email_confirmed_at)
        : null,
    username: typeof profile.username === "string" ? profile.username : null,
    name: fullName,
    firstName: firstName || null,
    lastName: lastName || null,
    phone: typeof profile.phone === "string" ? profile.phone : null,
    role,
    avatar_url: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
    location: typeof profile.location === "string" ? profile.location : null,
    option: typeof profile.option === "string" ? profile.option : null,
    search_target: typeof profile.search_target === "string" ? profile.search_target : null,
    company_name: typeof profile.company_name === "string" ? profile.company_name : null,
    status: typeof profile.status === "string" ? profile.status : "active",
  };
};

const ensureOAuthProfile = async (input: OAuthProfileInput): Promise<CustomUser | null> => {
  const email = input.email?.toLowerCase().trim();
  if (!email) return null;

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    console.error("[NextAuth][oauth] profile lookup failed", {
      email: maskEmail(email),
      error: existingProfileError.message,
    });
    return null;
  }

  if (existingProfile) {
    if (existingProfile.status === "suspended" || existingProfile.status === "deleted") {
      logAuthDebug("[NextAuth][oauth] profile status blocked", {
        userId: existingProfile.id,
        status: existingProfile.status,
      });
      return null;
    }

    return profileToCustomUser(existingProfile);
  }

  const { firstName, lastName } = splitOAuthName(input.name, email);
  const username = await resolveUniqueUsername(buildOAuthUsernameBase(input));
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      username,
      first_name: firstName,
      last_name: lastName,
      avatar_url: input.image ?? null,
      provider: "oauth",
    },
  });

  if (authError || !authData.user?.id) {
    console.error("[NextAuth][oauth] Supabase auth user creation failed", {
      email: maskEmail(email),
      error: authError?.message ?? "missing_user_id",
    });
    return null;
  }

  const { data: createdProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authData.user.id,
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      avatar_url: input.image ?? null,
      category: "proprietaire",
      role: "owner",
      onboarding_complete: false,
      onboarding_completed_at: null,
    })
    .select("*")
    .single();

  if (profileError || !createdProfile) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.error("[NextAuth][oauth] profile creation failed", {
      userId: authData.user.id,
      error: profileError?.message ?? "profile_not_created",
    });
    return null;
  }

  return profileToCustomUser(createdProfile);
};

const applyCustomUserToToken = (token: Record<string, unknown>, currentUser: CustomUser) => {
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
};

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

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authOptions: NextAuthConfig = {
  basePath: "/api/auth",
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
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const oauthUser = await ensureOAuthProfile({
        email: user?.email,
        name: user?.name,
        image: user?.image,
      });

      return Boolean(oauthUser);
    },
    async jwt({ token, user, account }) {
      if (account && account.provider !== "credentials") {
        const oauthUser = await ensureOAuthProfile({
          email: user?.email ?? token.email,
          name: user?.name ?? token.name,
          image: user?.image ?? null,
        });

        if (oauthUser) {
          applyCustomUserToToken(token, oauthUser);
        }

        return token;
      }

      if (user) {
        const currentUser = user as CustomUser;
        applyCustomUserToToken(token, currentUser);
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
