// src/app/api/auth/update-profile/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    try {
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !user) {
            return NextResponse.json({ error: "Utilisateur non authentifié." }, { status: 401 });
        }

        const { category, searchTarget, option, location, firstName, lastName, email, phone, additionalInfo } = body;

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                category,
                search_target: searchTarget,
                option,
                location,
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                additional_info: additionalInfo,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error) {
        let msg = "Erreur serveur.";
        if (error instanceof Error) msg = error.message;
        return NextResponse.json({ error: msg }, { status: 500 });
    }

}
