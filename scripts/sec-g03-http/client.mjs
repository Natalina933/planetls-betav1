import assert from 'node:assert/strict';
import { endpoint } from './plan.mjs';

/** Only local endpoints; never follows a redirect and never prints bodies/cookies. */
export function createClient({ appUrl, gatewayUrl, ports, fetchImpl = globalThis.fetch }) {
  const app = endpoint(appUrl, ports.app), gateway = endpoint(gatewayUrl, ports.gateway);
  async function request(origin, route, options = {}) {
    const url = new URL(route, origin);
    if (![app, gateway].includes(url.origin) || url.username || url.password) throw new Error('URL hors campagne.');
    if (origin === app && url.origin !== app) throw new Error('Origine applicative modifiée.');
    if (origin === gateway && url.origin !== gateway) throw new Error('Origine Storage modifiée.');
    return fetchImpl(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(30000) });
  }
  const get = (route, cookie) => request(app, route, { headers: cookie ? { cookie } : {} });
  const post = (route, body, cookie, operation) => request(app, route, { method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...(operation ? { 'Idempotency-Key': operation } : {}) }, body: JSON.stringify(body) });
  async function login(account) {
    assert.match(account.email, /@example\.invalid$/);
    const jar = new Map();
    const receive = response => response.headers.getSetCookie().forEach(value => {
      const pair = value.split(';', 1)[0], index = pair.indexOf('=');
      if (index > 0) jar.set(pair.slice(0, index), pair.slice(index + 1));
    });
    const cookie = () => [...jar].map(([key, value]) => `${key}=${value}`).join('; ');
    const csrf = await get('/api/auth/csrf'); assert.equal(csrf.status, 200); receive(csrf);
    const { csrfToken } = await csrf.json(); assert.ok(csrfToken);
    const response = await request(app, '/api/auth/callback/credentials', { method: 'POST', headers: {
      cookie: cookie(), 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1'
    }, body: new URLSearchParams({ csrfToken, email: account.email, password: account.password, callbackUrl: app }) });
    assert.equal(response.status, 200); receive(response);
    const sessionResponse = await get('/api/auth/session', cookie()); assert.equal(sessionResponse.status, 200);
    const session = await sessionResponse.json();
    assert.equal(session.user?.id, account.id); assert.equal(session.user?.role, account.role);
    return cookie();
  }
  const upload = (missionId, cookie) => {
    const form = new FormData();
    form.set('file', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf9sAAAAASUVORK5CYII=', 'base64')], 'synthetic.png', { type: 'image/png' }));
    return request(app, `/api/missions/${missionId}/files`, { method: 'POST', headers: { cookie }, body: form });
  };
  const signed = url => request(gateway, url);
  return { get, post, request, login, upload, signed };
}
