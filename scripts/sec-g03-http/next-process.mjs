import { endpoint } from './plan.mjs';

const systemKeys = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|TEMP|TMP|APPDATA|LOCALAPPDATA|USERPROFILE|HOMEDRIVE|HOMEPATH|HOME)$/i;
/** No .env discovery/loading. Caller must copy only reviewed git blobs to a new directory. */
export function snapshotPaths(paths) {
  return paths.filter(path => {
    if (path.startsWith('/') || /^[A-Za-z]:/.test(path) || path.includes('\\') || path.split('/').includes('..')) throw new Error('Chemin git invalide.');
    return !path.split('/').some(part => /^\.env(?:\.|$)/i.test(part) || ['.git', '.next', 'node_modules', '.aws', '.codex'].includes(part))
      && !/\.(pem|key|p12|pfx)$/i.test(path);
  });
}
export function nextEnvironment({ inherited = {}, manifest, secrets, guardUrl, appUrl, gatewayUrl }) {
  endpoint(appUrl, manifest.ports.app); endpoint(gatewayUrl, manifest.ports.gateway);
  if (!guardUrl.startsWith('file:///') || /[\r\n"]/.test(guardUrl)) throw new Error('Garde réseau invalide.');
  return {
    ...Object.fromEntries(Object.entries(inherited).filter(([key]) => systemKeys.test(key))),
    NODE_ENV: 'development', NODE_OPTIONS: `--import=${guardUrl}`, NEXT_TELEMETRY_DISABLED: '1',
    NEXT_DIST_DIR: '.next-g03', NEXTAUTH_URL: appUrl, NEXT_PUBLIC_SITE_URL: appUrl,
    NEXT_PUBLIC_SUPABASE_URL: gatewayUrl, SUPABASE_URL: gatewayUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: secrets.anonKey, SUPABASE_SERVICE_ROLE_KEY: secrets.serviceKey,
    NEXTAUTH_SECRET: secrets.authSecret, AUTH_SECRET: secrets.authSecret,
    WORKSPACE_QUICK_LOGIN_ENABLED: 'false', LOCAL_E2E_MODE: 'false',
    PLANETLS_MISSION_ASSIGNMENTS_READY: 'false', G03_GUARD_ENABLED: '1',
    G03_ALLOWED_PORTS: `${manifest.ports.app},${manifest.ports.gateway}`,
    GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', GITHUB_CLIENT_ID: '', GITHUB_CLIENT_SECRET: '',
    STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ''
  };
}
export function nextCommand(nodePath, nextCli, manifest) {
  return { command: nodePath, args: [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(manifest.ports.app)], shell: false, windowsHide: true };
}
