import { getWeatherCondition } from "./weatherCode";

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: OpenMeteoCurrent;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windGusts: number;
  condition: {
    label: string;
    icon: string;
  };
};

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));

  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
    ].join(","),
  );

  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;

  if (!data.current) {
    return null;
  }

  return {
    time: data.current.time,
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    windGusts: data.current.wind_gusts_10m,
    condition: getWeatherCondition(data.current.weather_code),
  };
}
