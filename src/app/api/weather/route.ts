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
    .select("city, location, service_area")
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

  const city =
    profile.city?.trim() ||
    profile.location?.trim() ||
    profile.service_area?.trim();

  console.info("[weather] city", {
    city: profile.city ?? null,
    location: profile.location ?? null,
    service_area: profile.service_area ?? null,
    selected: city || null,
  });

  if (!city) {
    return NextResponse.json(
      { error: "Profile city not configured" },
      { status: 422 },
    );
  }

  let weatherStage: "geocoding" | "provider" = "geocoding";

  try {
    // 1. Transformer la ville en coordonnées GPS
    console.info("[weather] geocoding_start", { query: city });
    const location = await geocodeLocation(city);

    if (!location) {
      console.warn("[weather] geocoding_failed", {
        query: city,
        reason: "not_found",
      });

      return NextResponse.json(
        { error: "City not found" },
        { status: 404 },
      );
    }

    // 2. Récupérer la météo avec les coordonnées
    console.info("[weather] geocoding_success", {
      query: city,
      latitude: location.latitude,
      longitude: location.longitude,
      displayName: location.displayName,
    });

    console.info("[weather] provider_start", {
      latitude: location.latitude,
      longitude: location.longitude,
    });

    weatherStage = "provider";

    const weather = await fetchWeather(
      location.latitude,
      location.longitude,
    );

    if (!weather) {
      console.warn("[weather] provider_failed", {
        latitude: location.latitude,
        longitude: location.longitude,
        reason: "missing_current_weather",
      });

      return NextResponse.json(
        { error: "Weather data unavailable" },
        { status: 502 },
      );
    }

    console.info("[weather] provider_success", {
      temperature: weather.temperature,
      weatherCode: weather.weatherCode,
    });

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
    console.error(
      weatherStage === "geocoding"
        ? "[weather] geocoding_failed"
        : "[weather] provider_failed",
      error,
    );
    console.error("[weather] Weather request error:", error);

    return NextResponse.json(
      { error: "Weather service unavailable" },
      { status: 502 },
    );
  }
}
