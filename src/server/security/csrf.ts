import type { NextRequest } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const EXEMPT_PATH_PREFIXES = ["/api/auth"];
const EXEMPT_PATHS = new Set(["/api/billing/webhook"]);
const SERVER_TO_SERVER_HEADERS = ["authorization", "stripe-signature", "x-api-key"];

const normalizeOrigin = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin.toLowerCase();
  } catch {
    return null;
  }
};

const parseConfiguredOrigins = (): string[] => {
  const configuredOrigins = [
    process.env.CSRF_TRUSTED_ORIGINS,
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(configuredOrigins));
};

const hasServerToServerCredential = (req: Pick<NextRequest, "headers">): boolean =>
  SERVER_TO_SERVER_HEADERS.some((headerName) => {
    const value = req.headers.get(headerName);
    return typeof value === "string" && value.trim().length > 0;
  });

const isExemptPath = (pathname: string): boolean =>
  EXEMPT_PATHS.has(pathname) || EXEMPT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const resolveRequestSourceOrigin = (req: Pick<NextRequest, "headers">): string | null => {
  const originHeader = normalizeOrigin(req.headers.get("origin"));
  if (originHeader) {
    return originHeader;
  }

  const refererHeader = req.headers.get("referer");
  if (!refererHeader) {
    return null;
  }

  try {
    return new URL(refererHeader).origin.toLowerCase();
  } catch {
    return null;
  }
};

export type CsrfCheckResult =
  | { ok: true; reason: "safe_method" | "exempt_path" | "server_to_server" | "trusted_origin" }
  | { ok: false; reason: "missing_origin" | "invalid_origin" };

export function checkApiMutationCsrf(
  req: Pick<NextRequest, "method" | "headers" | "nextUrl">,
): CsrfCheckResult {
  const method = req.method.toUpperCase();
  if (!UNSAFE_METHODS.has(method)) {
    return { ok: true, reason: "safe_method" };
  }

  const { pathname, origin: requestOrigin } = req.nextUrl;
  if (!pathname.startsWith("/api")) {
    return { ok: true, reason: "safe_method" };
  }

  if (isExemptPath(pathname)) {
    return { ok: true, reason: "exempt_path" };
  }

  if (hasServerToServerCredential(req)) {
    return { ok: true, reason: "server_to_server" };
  }

  const sourceOrigin = resolveRequestSourceOrigin(req);
  if (!sourceOrigin) {
    return { ok: false, reason: "missing_origin" };
  }

  const trustedOrigins = new Set<string>([
    requestOrigin.toLowerCase(),
    ...parseConfiguredOrigins(),
  ]);

  if (!trustedOrigins.has(sourceOrigin)) {
    return { ok: false, reason: "invalid_origin" };
  }

  return { ok: true, reason: "trusted_origin" };
}
