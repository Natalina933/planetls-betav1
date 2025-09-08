"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types"; // optionnel si tu veux TS

const supabase = createClientComponentClient<Database>();

export default supabase;
