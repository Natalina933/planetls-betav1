// types/next-auth.d.ts
// Configuration des types NextAuth pour votre application
import type { DefaultSession, DefaultUser } from "next-auth";
import type { UserRole } from "./supabase"; // adapte le chemin

declare module "next-auth" {
    interface User extends DefaultUser {
        id: string;
        username: string; // <- ce champ doit correspondre à "username" dans la requête UserRecord
        role: UserRole;
        email: string;
        avatar_url?: string | null;
    }
    interface Session extends DefaultSession {
        user: {
            id: string;
            username: string;
            role: UserRole;
            email: string;
            avatar_url?: string | null;
        } & DefaultSession["user"];
    }
}
declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        role: UserRole;
        email: string;
        avatar_url?: string | null;
    }
}
