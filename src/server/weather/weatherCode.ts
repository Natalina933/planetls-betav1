export type WeatherCondition = {
  label: string;
  icon: string;
};

export function getWeatherCondition(
  weatherCode: number,
): WeatherCondition {
  switch (weatherCode) {
    case 0:
      return {
        label: "Ciel dégagé",
        icon: "clear",
      };

    case 1:
      return {
        label: "Principalement dégagé",
        icon: "mostly-clear",
      };

    case 2:
      return {
        label: "Partiellement nuageux",
        icon: "partly-cloudy",
      };

    case 3:
      return {
        label: "Couvert",
        icon: "cloudy",
      };

    case 45:
    case 48:
      return {
        label: "Brouillard",
        icon: "fog",
      };

    case 51:
    case 53:
    case 55:
      return {
        label: "Bruine",
        icon: "drizzle",
      };

    case 56:
    case 57:
      return {
        label: "Bruine verglaçante",
        icon: "freezing-drizzle",
      };

    case 61:
    case 63:
    case 65:
      return {
        label: "Pluie",
        icon: "rain",
      };

    case 66:
    case 67:
      return {
        label: "Pluie verglaçante",
        icon: "freezing-rain",
      };

    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label: "Neige",
        icon: "snow",
      };

    case 80:
    case 81:
    case 82:
      return {
        label: "Averses",
        icon: "showers",
      };

    case 85:
    case 86:
      return {
        label: "Averses de neige",
        icon: "snow-showers",
      };

    case 95:
      return {
        label: "Orage",
        icon: "thunderstorm",
      };

    case 96:
    case 99:
      return {
        label: "Orage avec grêle",
        icon: "thunderstorm-hail",
      };

    default:
      return {
        label: "Conditions inconnues",
        icon: "unknown",
      };
  }
}