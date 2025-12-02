import { before, after, test } from 'node:test';
import assert from 'node:assert';

process.env.NODE_ENV = 'production';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://supabase.local';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.ANALYTICS_ALLOWED_ORIGINS = 'http://localhost:5173';

let startServer;
let stopServer;
let httpServer;
let supabase;
let port;

const TOKENS = {
  'user-token': { id: 'user-1', roles: [] },
  'admin-token': { id: 'admin-1', roles: ['admin'] },
};

function createQuery(data = []) {
  return {
    select() { return this; },
    order() { return this; },
    limit() { return Promise.resolve({ data, error: null }); },
    eq() { return this; },
  };
}

before(async () => {
  const module = await import('../server/analyticsGateway.mjs');
  ({ startServer, stopServer, httpServer, supabase } = module);

  supabase.auth = {
    async getUser(token) {
      const entry = TOKENS[token];
      if (!entry) {
        return { data: null, error: { message: 'Invalid token' } };
      }
      return {
        data: {
          user: {
            id: entry.id,
            app_metadata: { roles: entry.roles },
          },
        },
        error: null,
      };
    },
    async refreshSession() {
      return { data: { session: { access_token: 'admin-token' } }, error: null };
    },
    async getSession() {
      return { data: { session: { access_token: 'admin-token' } }, error: null };
    },
  };

  supabase.rpc = async (fn) => {
    if (fn === 'refresh_analytics_views') {
      return { data: null, error: null };
    }
    return { data: [], error: null };
  };

  supabase.from = () => createQuery([]);

  // Use random port for tests
  const assignedPort = await startServer(0);
  port = assignedPort;
});

after(async () => {
  await stopServer();
});

function makeUrl(path) {
  return `http://localhost:${port}${path}`;
}

test('rejects unauthorized requests', async () => {
  const res = await fetch(makeUrl('/api/v1/metrics/daily'));
  assert.strictEqual(res.status, 401);
});

test('allows authenticated user for metrics', async () => {
  const res = await fetch(makeUrl('/api/v1/metrics/daily'), {
    headers: {
      Authorization: 'Bearer user-token',
    },
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.deepStrictEqual(body.data, []);
});

test('non-admin cannot refresh', async () => {
  const res = await fetch(makeUrl('/api/v1/refresh'), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer user-token',
    },
  });
  assert.strictEqual(res.status, 403);
});

test('admin refresh respects rate limiting', async () => {
  // First three refreshes succeed
  for (let i = 0; i < 3; i += 1) {
    const res = await fetch(makeUrl('/api/v1/refresh'), {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  }

  // Fourth refresh should be rate limited
  const res = await fetch(makeUrl('/api/v1/refresh'), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer admin-token',
    },
  });
  assert.strictEqual(res.status, 429);
});
