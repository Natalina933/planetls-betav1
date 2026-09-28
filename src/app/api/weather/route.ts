import { NextRequest, NextResponse } from "next/server";

import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { geocodeLocation } from "@/server/location/geocodeLocation";
import { fetchWeather } from "@/server/weather/fetchWeather";

export async function GET(req: NextRequest) {
  const { userId } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("city")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[weather] Profile DB error:", error);

    return NextResponse.json(
      { error: "Database error" },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    );
  }

  const city = profile.city?.trim();

  if (!city) {
    return NextResponse.json(
      { error: "Profile city not configured" },
      { status: 422 },
    );
  }

  try {
    // 1. Transformer la ville en coordonnées GPS
    const location = await geocodeLocation(city);

    if (!location) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 },
      );
    }

    // 2. Récupérer la météo avec les coordonnées
    const weather = await fetchWeather(
      location.latitude,
      location.longitude,
    );

    if (!weather) {
      return NextResponse.json(
        { error: "Weather data unavailable" },
        { status: 502 },
      );
    }

    // 3. Retourner la localisation + la météo
    return NextResponse.json(
      {
        location: {
          city,
          latitude: location.latitude,
          longitude: location.longitude,
          displayName: location.displayName,
        },
        current: weather,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[weather] Weather request error:", error);

    return NextResponse.json(
      { error: "Weather service unavailable" },
      { status: 502 },
    );
  }
}