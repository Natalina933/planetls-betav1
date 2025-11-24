import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId)
      return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });

    const filePath = `user_${userId}_${Date.now()}`;
    const { data, error } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: publicData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicData.publicUrl });
  } catch (err) {
    console.error("[API Avatar Upload] ERREUR :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
