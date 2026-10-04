import test from "node:test";
import assert from "node:assert/strict";
import { createGeocoder, isGeocodingServiceError } from "../server/location/geocodeLocation.ts";

const nice = [{ lat: "43.7", lon: "7.27", address: { city: "Nice" } }];

test("géocodage : déduplication simultanée, cache et rayon sans nouvel appel", async () => {
  let calls = 0;
  const geocode = createGeocoder({ fetch: async () => { calls++; return Response.json(nice); } });
  const [a, b] = await Promise.all([geocode("Nice"), geocode(" nice ")]);
  assert.deepEqual(a, b);
  assert.equal((await geocode("NICE"))?.city, "Nice");
  assert.equal(calls, 1);
});

test("géocodage : espacement de deux villes et reprise après erreur", async () => {
  let time = 0; const calls: number[] = [];
  const geocode = createGeocoder({ now: () => time, wait: async (delay) => { time += delay; },
    fetch: async () => { calls.push(time); return Response.json(nice); } });
  await Promise.all([geocode("Nice"), geocode("Cannes")]);
  assert.equal(calls.length, 2);
  assert.ok(calls[1] - calls[0] >= 1000);
});

test("géocodage : 429 respecte Retry-After sans nouvelle requête, puis reprend", async () => {
  let time = 0; let calls = 0;
  const geocode = createGeocoder({ now: () => time, wait: async (delay) => { time += delay; },
    fetch: async () => ++calls === 1 ? new Response(null, { status: 429, headers: { "Retry-After": "120" } }) : Response.json(nice) });
  await assert.rejects(geocode("Nice"), (error) => isGeocodingServiceError(error) && error.retryAfterSeconds === 120);
  await assert.rejects(geocode("Nice"), (error) => isGeocodingServiceError(error));
  await assert.rejects(geocode("Cannes"), (error) => isGeocodingServiceError(error));
  assert.equal(calls, 1);
  time = 120001;
  assert.equal((await geocode("Nice"))?.city, "Nice");
  assert.equal(calls, 2);
});
