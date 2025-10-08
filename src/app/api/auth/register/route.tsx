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
      return NextResponse.json(
        { error: "Corps de requête invalide (JSON attendu)." },
        { status: 400 }
      );
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

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Champs requis manquants : email, password, username." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---------- ÉTAPE 2 : Diagnostic détaillé de la création utilisateur ----------
    let createData = null;
    let createError = null;

    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          username,
          firstName,
          lastName,
          phone,
          additionalInfo,
        },
        email_confirm: true,
      });

      createData = result.data;
      createError = result.error;
    } catch (err) {
      console.error("❌ Exception pendant createUser (erreur inattendue Supabase):", err);
      return NextResponse.json(
        { error: "Erreur interne Supabase lors de la création (exception)." },
        { status: 500 }
      );
    }

    // Si erreur Supabase explicite
    if (createError) {
      console.error("⚠️ Supabase createUser error detail:", {
        message: createError.message,
        name: createError.name,
        status: createError.status,
        code: createError.code,
      });

      // Test fallback : retente sans user_metadata (pour voir si c’est un champ JSON qui casse)
      if (createError.status === 500) {
        console.warn("Tentative de création sans user_metadata pour diagnostic...");
        const { data: retryData, error: retryError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (!retryError && retryData?.user?.id) {
          console.log("✅ Création réussie sans user_metadata — cause probable : champ invalide.");
          return NextResponse.json({
            warning: "Utilisateur créé sans user_metadata (un champ de metadata est invalide).",
            userId: retryData.user.id,
          });
        } else {
          console.error("❌ Échec même sans user_metadata:", retryError);
        }
      }

      return NextResponse.json(
        { error: createError.message || "Impossible de créer l'utilisateur." },
        { status: createError.status ?? 400 }
      );
    }

    const userId = createData?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Utilisateur créé mais aucun id renvoyé." },
        { status: 500 }
      );
    }

    // ---------- Insère le profil dans ta table 'profiles' ----------
    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
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

    return NextResponse.json({ message: "Utilisateur créé", userId }, { status: 201 });
  } catch (err) {
    console.error("register route unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}
