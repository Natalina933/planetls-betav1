// types/next-auth.d.ts ou à la racine

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    /**
     * L'objet User (celui retourné par authorize)
     */
    interface User extends DefaultUser {
        id: string;
        username: string;
        role: string;
    }

    /**
     * L'objet Session (celui accessible par useSession)
     */
    interface Session extends DefaultSession {
        user: {
            id: string;
            username: string;
            role: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    /**
     * L'objet JWT (le token chiffré)
     */
    interface JWT {
        id: string;
        username: string;
        role: string;
    }
}