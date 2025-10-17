import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/supabase";


export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@ex.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          console.error("❌ Supabase config missing");
          return null;
        }

        if (!credentials?.email || !credentials?.password) return null;

        // 🔐 Création du client Supabase
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          { auth: { persistSession: false } }
        );

        // 🔑 Authentification
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData?.user) {
          console.error("❌ Login error:", authError?.message);
          return null;
        }

        const user = authData.user;

        // 🧠 Récupération du profil dans `profiles`
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, email, category, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error("❌ Profile not found:", profileError?.message);
          return null;
        }

        const userRole = (profile.category || "proprietaire") as UserRole;

        return {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: userRole,
          name: profile.username || profile.email,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.email = user.email;
        token.avatar_url = user.avatar_url ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.avatar_url = token.avatar_url as string | null;
      }
      return session;
    },

    // ⚙️ Redirection simple vers /dashboard
    // (le middleware se charge ensuite de rediriger vers /dashboard/[role])
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
