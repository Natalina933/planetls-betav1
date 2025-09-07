import { NextResponse } from "next/server";
import supabase from "../../../lib/db";

export async function POST(request) {
  try {
    const { userId, message } = await request.json();

    const { data, error } = await supabase
      .from("alertes")
      .insert([{ user_id: userId, message, created_at: new Date() }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
