// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

export const { handlers } = NextAuth(authOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;
