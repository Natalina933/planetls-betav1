/** Compose-spec object in memory. Deliberately NOT a launchable compose file.
 * Bootstrap and read-only config injection remain explicit blockers in manifest.json. */
export function buildStack(manifest, identity, secrets) {
  const labels = { [`${identity.label}.run`]: identity.token, [`${identity.label}.purpose`]: 'synthetic-integration' };
  const base = key => ({ image: manifest.images[key].id, pull_policy: 'never', restart: 'no',
    labels, networks: ['isolated'], cap_drop: ['ALL'], security_opt: ['no-new-privileges:true'],
    pids_limit: 128, mem_limit: `${({ db: 1536, auth: 256, rest: 256, storage: 768, gateway: 768 })[key]}m`, cpus: ({ db: 1, auth: 0.5, rest: 0.5, storage: 1, gateway: 1 })[key],
    logging: { driver: 'local', options: { 'max-size': '5m', 'max-file': '2' } },
    tmpfs: ['/tmp:rw,nosuid,noexec,size=67108864'], read_only: true });
  const dbUrl = user => `postgres://${user}:${secrets.database}@db:5432/postgres`;
  return { name: identity.project, networks: { isolated: { name: `${identity.project}-net`, internal: true, labels } },
    services: {
      db: { ...base('db'), environment: { POSTGRES_PASSWORD: secrets.database, POSTGRES_DB: 'postgres', JWT_SECRET: secrets.jwtSecret },
        tmpfs: ['/tmp:rw,nosuid,noexec,size=67108864', '/var/lib/postgresql/data:rw,nosuid,noexec,size=1073741824', '/var/run/postgresql:rw,nosuid,noexec,size=16777216'] },
      auth: { ...base('auth'), depends_on: ['db'], environment: {
        GOTRUE_API_HOST: '0.0.0.0', GOTRUE_API_PORT: '9999', API_EXTERNAL_URL: `http://127.0.0.1:${manifest.ports.gateway}/auth/v1`,
        GOTRUE_DB_DRIVER: 'postgres', GOTRUE_DB_DATABASE_URL: dbUrl('supabase_auth_admin'),
        GOTRUE_SITE_URL: `http://127.0.0.1:${manifest.ports.app}`, GOTRUE_URI_ALLOW_LIST: '', GOTRUE_DISABLE_SIGNUP: 'true',
        GOTRUE_JWT_SECRET: secrets.jwtSecret, GOTRUE_JWT_AUD: 'authenticated', GOTRUE_JWT_ADMIN_ROLES: 'service_role',
        GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated', GOTRUE_JWT_EXP: '3600', GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true', GOTRUE_MAILER_AUTOCONFIRM: 'true' } },
      rest: { ...base('rest'), depends_on: ['db'], environment: { PGRST_DB_URI: dbUrl('authenticator'), PGRST_DB_SCHEMAS: 'public,storage', PGRST_DB_ANON_ROLE: 'anon', PGRST_JWT_SECRET: secrets.jwtSecret, PGRST_DB_USE_LEGACY_GUCS: 'false' } },
      storage: { ...base('storage'), depends_on: ['db', 'rest'], environment: {
        ANON_KEY: secrets.anonKey, SERVICE_KEY: secrets.serviceKey, PGRST_JWT_SECRET: secrets.jwtSecret,
        DATABASE_URL: dbUrl('supabase_storage_admin'), POSTGREST_URL: 'http://rest:3000', STORAGE_BACKEND: 'file',
        FILE_STORAGE_BACKEND_PATH: '/var/lib/storage', FILE_SIZE_LIMIT: '26214400', TENANT_ID: identity.project,
        REGION: 'local', GLOBAL_S3_BUCKET: 'local', ENABLE_IMAGE_TRANSFORMATION: 'false' },
        tmpfs: ['/tmp:rw,nosuid,noexec,size=67108864', '/var/lib/storage:rw,nosuid,noexec,size=268435456'] },
      gateway: { ...base('gateway'), depends_on: ['auth', 'rest', 'storage'],
        ports: [{ target: 8000, published: String(manifest.ports.gateway), host_ip: '127.0.0.1', protocol: 'tcp' }],
        environment: { KONG_DATABASE: 'off', KONG_DECLARATIVE_CONFIG: '/run/g03/kong.json', KONG_ADMIN_LISTEN: 'off', KONG_PROXY_LISTEN: '0.0.0.0:8000', KONG_PLUGINS: 'key-auth,acl', KONG_PREFIX: '/tmp/kong' } }
    } };
}
export function buildGateway(secrets) {
  return { _format_version: '2.1', _transform: true,
    consumers: [{ username: 'anon', keyauth_credentials: [{ key: secrets.anonKey }] }, { username: 'service_role', keyauth_credentials: [{ key: secrets.serviceKey }] }],
    acls: [{ consumer: 'anon', group: 'anon' }, { consumer: 'service_role', group: 'admin' }],
    services: [['auth', 9999, 'auth'], ['rest', 3000, 'rest'], ['storage', 5000, 'storage']].map(([name, port, prefix]) => ({
      name, url: `http://${name}:${port}/`, routes: [{ name, paths: [`/${prefix}/v1/`], strip_path: true }],
      plugins: [{ name: 'key-auth', config: { hide_credentials: false } }, { name: 'acl', config: { allow: ['anon', 'admin'], hide_groups_header: true } }]
    })) };
}
