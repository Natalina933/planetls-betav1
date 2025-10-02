// Fichier : app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { compare } from "bcryptjs";

// --- Types Locaux ---
// (Ces types sont nécessaires pour la vérification TypeScript dans ce fichier)
type UserCredentials = {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar_url?: string | null;
  role: string;
};
// Définit l'objet utilisateur SANS le champ 'password'
type UserWithoutPassword = Omit<UserCredentials, "password">;
// ----------------------------------------------------------------------
// Configuration NextAuth (Auth.js)
// ----------------------------------------------------------------------
const handler = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        // Initialisation Sécurisée de Supabase
        if (
          !process.env.SUPABASE_SERVICE_ROLE_KEY ||
          !process.env.NEXT_PUBLIC_SUPABASE_URL
        ) {
          console.error(
            "Erreur de configuration : Clés Supabase manquantes pour NextAuth."
          );
          return null;
        }
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Récupération de l'utilisateur (AVEC le hash)
        const { data: userRecord } = await supabase
          .from("users")
          .select("id, username, email, password, avatar_url, role")
          .eq("email", credentials.email)
          .single<UserCredentials>();

        if (!userRecord) {
          return null;
        }

        // 2. Vérification du mot de passe
        const passwordMatch = await compare(
          credentials.password,
          userRecord.password
        );

        if (!passwordMatch) {
          return null;
        }

        // 3. Succès : Nettoyage et Renvoi (Méthode de suppression typée)
        // On copie l'objet et on force le type à UserWithoutPassword.
const { id, username, email, avatar_url, role } = userRecord;
const userWithoutHash: UserWithoutPassword = { id, username, email, avatar_url, role };
return userWithoutHash;

      },
    }),
  ],

  // Callbacks (Aucun changement nécessaire)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login", // Changé pour une page de login standard
  },
});

export { handler as GET, handler as POST };
