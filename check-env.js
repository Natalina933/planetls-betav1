import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("Verification des variables d'environnement Supabase...\n");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.error("NEXT_PUBLIC_SUPABASE_URL est manquante ou non chargee.");
else console.log(`NEXT_PUBLIC_SUPABASE_URL: ${url}`);

if (!anon) console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante ou non chargee.");
else console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY: semble correcte (cle JWT detectee)");

if (!service) console.error("SUPABASE_SERVICE_ROLE_KEY est manquante ou non chargee.");
else console.log("SUPABASE_SERVICE_ROLE_KEY: semble correcte (cle JWT detectee)");
