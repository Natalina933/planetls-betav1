// types/next-auth.d.ts
// Configuration des types NextAuth pour votre application
import type { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "./supabase";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    email: string;
    username?: string | null; // ← Optionnel
    name?: string | null;
    avatar_url?: string | null;
    role?: UserRole | null;
  }
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      username?: string | null; // ← Optionnel ici aussi
      name?: string | null;
      avatar_url?: string | null;
      role?: UserRole | null;
    } & DefaultSession["user"];
  }
}

// Pareil pour JWT :
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    username?: string | null; // ← Optionnel ici aussi
    name?: string | null;
    avatar_url?: string | null;
    role?: UserRole | null;
  }
}
