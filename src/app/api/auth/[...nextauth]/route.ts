import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/supabase"; // ajuste le chemin

// Mappe les champs pour coller à ta table "users" de Supabase


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
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || // ⚠️ Vérifiez si l'ANON KEY est définie
          !process.env.NEXT_PUBLIC_SUPABASE_URL
        ) {
          console.error(
            "Erreur config Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY manquante)"
          );
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        } // 1. CRÉATION DU CLIENT SUPABASE (avec la Clé Publique/Anon Key)

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // 🔑 Utilisation de la Clé Publique (Anon Key)
          { auth: { persistSession: false } }
        ); // 2. AUTHENTIFICATION VIA SUPABASE AUTH SERVICE

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError) {
          console.error(
            "❌ Échec signInWithPassword (Supabase):",
            authError.message
          );
          return null; // Renvoie 401 à NextAuth
        }
        const user = authData.user;
        if (!user) return null; // 3. RÉCUPÉRATION DES DONNÉES DE PROFIL (pour username, role)

        // La table 'profiles' contient les champs personnalisés
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, email, category, avatar_url") // 'category' de la BDD deviendra 'role' de NextAuth
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error(
            "❌ Profil non trouvé (profiles):",
            profileError?.message
          );
          return null;
        }

        // Mappage de 'category' du profil vers 'role' de NextAuth (conformité avec vos types)
        const userRole = (profile.category || "proprietaire") as UserRole; // 4. On retourne l'objet User pour la session NextAuth

        return {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: userRole,
          name: profile.username || profile.email, // 'name' est requis par DefaultUser
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Ajoute les bons champs pour JWT
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.email = user.email;
        token.avatar_url = user.avatar_url ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      // Met à jour la session utilisateur de façon typée
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.avatar_url = token.avatar_url as string | null;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
