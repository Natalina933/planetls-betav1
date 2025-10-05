// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Variables d'environnement Supabase manquantes (server)." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Corps de requête invalide (JSON attendu)." }, { status: 400 });
    }

    const {
      email,
      password,
      username,
      firstName = null,
      lastName = null,
      phone = null,
      avatar_url = null,
      additionalInfo = null,
      role = "user",
    } = body;

    // validations basiques
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Champs requis manquants : email, password, username." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) créer l'utilisateur dans Supabase Auth (admin)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        username,
        firstName,
        lastName,
        phone,
        additionalInfo,
      },
      // à true si tu veux marquer l'email 'confirmé' immédiatement (optionnel)
      email_confirm: true,
    });

    if (createError) {
      console.error("Supabase createUser error:", createError);
      return NextResponse.json(
        { error: createError.message || "Impossible de créer l'utilisateur." },
        { status: createError.status ?? 400 }
      );
    }

    const userId = createData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur créé mais aucun id renvoyé." }, { status: 500 });
    }

    // 2) insérer le profil correspondant dans public.profiles (ou la table que tu utilises)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userId,
          username,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          avatar_url,
          additional_info: additionalInfo,
          role,
        },
      ]);

    if (profileError) {
      // rollback : supprimer l'utilisateur créé pour éviter orphelins
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (delErr) {
        console.error("Rollback: impossible de supprimer l'utilisateur créé :", delErr);
      }

      console.error("Erreur insertion profile:", profileError);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil : " + profileError.message },
        { status: 500 }
      );
    }

    // tout OK
    return NextResponse.json({ message: "Utilisateur créé", userId }, { status: 201 });
  } catch (err) {
    console.error("register route unexpected error:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}
