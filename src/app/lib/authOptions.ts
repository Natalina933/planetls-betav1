import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// importe tes autres providers ou adapters si besoin

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
};
