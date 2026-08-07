import test from "node:test";
import assert from "node:assert/strict";

import { checkApiMutationCsrf } from "../server/security/csrf.ts";

type MockRequest = Parameters<typeof checkApiMutationCsrf>[0];

function createRequest({
  method = "POST",
  pathname = "/api/missions",
  requestOrigin = "https://app.planetls.test",
  headers = {},
}: {
  method?: string;
  pathname?: string;
  requestOrigin?: string;
  headers?: Record<string, string>;
} = {}): MockRequest {
  return {
    method,
    headers: new Headers(headers),
    nextUrl: {
      pathname,
      origin: requestOrigin,
    },
  } as MockRequest;
}

test("allows same-origin mutation requests", () => {
  const result = checkApiMutationCsrf(
    createRequest({
      headers: {
        origin: "https://app.planetls.test",
      },
    }),
  );

  assert.deepEqual(result, { ok: true, reason: "trusted_origin" });
});

test("allows referer fallback when origin header is absent", () => {
  const result = checkApiMutationCsrf(
    createRequest({
      headers: {
        referer: "https://app.planetls.test/dashboard/owner",
      },
    }),
  );

  assert.deepEqual(result, { ok: true, reason: "trusted_origin" });
});

test("rejects cross-origin mutation requests", () => {
  const result = checkApiMutationCsrf(
    createRequest({
      headers: {
        origin: "https://evil.example",
      },
    }),
  );

  assert.deepEqual(result, { ok: false, reason: "invalid_origin" });
});

test("allows auth endpoints without origin checks", () => {
  const result = checkApiMutationCsrf(
    createRequest({
      pathname: "/api/auth/login",
    }),
  );

  assert.deepEqual(result, { ok: true, reason: "exempt_path" });
});

test("allows signed Stripe webhooks without browser origin", () => {
  const result = checkApiMutationCsrf(
    createRequest({
      pathname: "/api/billing/webhook",
      headers: {
        "stripe-signature": "t=123,v1=signature",
      },
    }),
  );

  assert.deepEqual(result, { ok: true, reason: "exempt_path" });
});

test("allows server-to-server bearer calls without browser origin", () => {
  const result = checkApiMutationCsrf(
    createRequest({
      headers: {
        authorization: "Bearer internal-token",
      },
    }),
  );

  assert.deepEqual(result, { ok: true, reason: "server_to_server" });
});
