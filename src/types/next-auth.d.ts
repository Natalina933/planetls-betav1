import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole } from "./supabase";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    email: string;

    username: string | null;
    name: string;
    avatar_url: string | null;

    role: UserRole;
    status: string;

    firstName: string | null;
    lastName: string | null;
    phone: string | null;

    location: string | null;
    option: string | null;
    search_target: string | null;

    company_name: string | null;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;

      username: string | null;
      name: string;
      avatar_url: string | null;

      role: UserRole;
      status: string;

      firstName: string | null;
      lastName: string | null;
      phone: string | null;

      location: string | null;
      option: string | null;
      search_target: string | null;

      company_name: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;

    username: string | null;
    name: string;
    avatar_url: string | null;

    role: UserRole;
    status: string;

    firstName: string | null;
    lastName: string | null;
    phone: string | null;

    location: string | null;
    option: string | null;
    search_target: string | null;

    company_name: string | null;
  }
}
