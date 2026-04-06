const FALLBACK_ALLOWED_ORIGINS = [
  "https://la-campania.vercel.app",
  "http://localhost:3000",
];

function splitOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getPort(defaultPort = 3000): number {
  return parseInt(process.env.PORT ?? String(defaultPort), 10);
}

export function getAllowedOrigins(): string[] {
  const configuredOrigins = splitOrigins(process.env.CORS_ALLOWED_ORIGINS);
  return configuredOrigins.length > 0 ? configuredOrigins : FALLBACK_ALLOWED_ORIGINS;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}
