// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/app/lib/authOptions";

export const { GET, POST } = handlers;
