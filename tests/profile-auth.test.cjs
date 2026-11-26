const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const backendRequire = createRequire(path.join(root, 'backend/package.json'));
const express = backendRequire('express');
const jwt = backendRequire('jsonwebtoken');
const secret = 'test-only-profile-auth-secret';
process.env.JWT_SECRET = secret;
process.env.DOTENV_CONFIG_QUIET = 'true';

const player = { id: 7, username: 'Hamza', email: 'player@example.test', total_points: 80, games_played: 2 };
const sessions = [{ score_earned: 20, riddles_answered: 5, played_at: '2026-11-26' }];
const queries = [];
const dbPath = backendRequire.resolve('./config/db');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: {
    async execute(sql, params) {
      queries.push({ sql, params });
      if (sql.startsWith('SELECT id,')) return [[{ ...player }]];
      if (sql.startsWith('SELECT score_earned')) return [sessions];
      if (sql.startsWith('UPDATE users')) return [{ affectedRows: 1 }];
      throw new Error(`Unexpected test query: ${sql}`);
    }
  }
};

let server;
let apiUrl;
before(async () => {
  const app = express();
  app.use('/api/profile', backendRequire('./routes/profile'));
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  apiUrl = `http://127.0.0.1:${server.address().port}/api/profile`;
});
beforeEach(() => { queries.length = 0; });
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

const sign = (claims = { id: player.id, username: player.username }, options = {}) =>
  jwt.sign(claims, secret, { expiresIn: '1h', ...options });

for (const method of ['GET', 'PATCH']) {
  for (const [label, token, status] of [
    ['missing', null, 401],
    ['malformed', 'not-a-jwt', 403],
    ['expired', sign(undefined, { expiresIn: -60 }), 403],
    ['wrong signature', jwt.sign({ id: player.id }, 'different-test-secret'), 403],
    ['invalid player ID', sign({ id: -1 }), 403]
  ]) {
    test(`${method} rejects a ${label} token before accessing the database`, async () => {
      const response = await fetch(apiUrl, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      assert.equal(response.status, status);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(typeof (await response.json()).message, 'string');
      assert.equal(queries.length, 0);
    });
  }
}

test('profile and history queries use the ID verified by the shared middleware', async () => {
  const response = await fetch(`${apiUrl}?userId=999`, { headers: { Authorization: `Bearer ${sign()}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { profile: player, sessions });
  assert.deepEqual(queries.map(query => query.params), [[player.id], [player.id]]);
});

test('editing a username updates only the authenticated player', async () => {
  const response = await fetch(apiUrl, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${sign()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '  Nouveau nom  ', id: 999, userId: 999 })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { username: 'Nouveau nom' });
  assert.deepEqual(queries[0].params, ['Nouveau nom', player.id]);
});

function response(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

function browser({ token = 'saved-token', fetcher = async () => response(200, { profile: player, sessions }) } = {}) {
  const storage = new Map([['user', JSON.stringify(player)], ['7ajayatna_state', '{"playerName":"Local","totalScore":5}']]);
  if (token) storage.set('token', token);
  const redirects = [];
  const requests = [];
  const listeners = new Map();
  const elements = new Map();
  const node = () => ({
    textContent: '', value: '', hidden: false, disabled: false, open: false, dataset: {}, children: [],
    attributes: new Map(), listeners: new Map(), classList: { add() {} },
    getAttribute(name) { return this.attributes.get(name) || ''; },
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
    addEventListener(name, handler) { this.listeners.set(name, handler); },
    querySelectorAll() { return this.children; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    showModal() { this.open = true; }, close() { this.open = false; }, focus() {}
  });
  function element(id) {
    if (!elements.has(id)) {
      const value = node();
      if (id === 'history-sources' || id === 'history-filters') {
        const sources = id === 'history-sources';
        value.children = (sources ? ['device', 'account'] : ['all', 'correct', 'missed']).map(choice => {
          const button = node();
          button.dataset[sources ? 'source' : 'result'] = choice;
          return button;
        });
      }
      elements.set(id, value);
    }
    return elements.get(id);
  }
  const context = vm.createContext({
    AbortSignal,
    location: { hostname: 'localhost', protocol: 'http:', replace: url => redirects.push(url) },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    },
    window: { addEventListener: (name, handler) => listeners.set(name, handler) },
    document: { getElementById: element, createElement: node },
    LEVELS_DATA: [{ id: 1, title: 'Sahla', unlockScore: 0 }, { id: 2, title: 'Mtwassat', unlockScore: 60 }],
    fetch: async (url, options) => { requests.push({ url, options }); return fetcher(url, options); }
  });
  const run = file => vm.runInContext(readFileSync(path.join(root, 'frontend', file), 'utf8'), context, { filename: file });
  run('profile-data.js');
  const data = vm.runInContext('ProfileData', context);
  return { data, storage, redirects, requests, listeners, element, run };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('profile/history reuse the same token and synchronize the game user cache', async () => {
  const state = browser();
  assert.equal(state.data.requireSession(), 'saved-token');
  await state.data.requestProfile(state.data.readToken());
  await state.data.requestProfile(state.data.readToken());
  assert.equal(state.requests.length, 2);
  for (const { options } of state.requests) assert.equal(options.headers.Authorization, 'Bearer saved-token');
  assert.equal(state.storage.get('token'), 'saved-token');
  assert.deepEqual(JSON.parse(state.storage.get('user')), player);
  assert.deepEqual(state.redirects, []);
});

for (const status of [401, 403]) {
  test(`${status} clears the rejected session and redirects to login without deleting game progress`, async () => {
    const state = browser({ fetcher: async () => response(status, { message: 'Session invalide' }) });
    await assert.rejects(state.data.requestProfile('saved-token'), { name: 'ProfileSessionError' });
    assert.equal(state.storage.has('token'), false);
    assert.equal(state.storage.has('user'), false);
    assert.equal(state.storage.has('7ajayatna_state'), true);
    assert.deepEqual(state.redirects, ['login.html']);
  });
}

for (const [label, fetcher] of [
  ['a server error', async () => response(500, { message: 'Serveur indisponible' })],
  ['a connection failure', async () => { throw new TypeError('Failed to fetch'); }]
]) {
  test(`${label} does not sign the player out`, async () => {
    const state = browser({ fetcher });
    await assert.rejects(state.data.requestProfile('saved-token'));
    assert.equal(state.storage.get('token'), 'saved-token');
    assert.deepEqual(state.redirects, []);
  });
}

for (const status of [200, 403]) {
  test(`an old ${status} response cannot overwrite or sign out a new session`, async () => {
    let finish;
    const state = browser({ fetcher: () => new Promise(resolve => { finish = resolve; }) });
    const pending = state.data.requestProfile('saved-token');
    state.storage.set('token', 'new-player-token');
    state.storage.set('user', JSON.stringify({ id: 22, username: 'New player' }));
    finish(response(status, { profile: player }));
    await assert.rejects(pending, { name: 'ProfileSessionError' });
    assert.equal(state.storage.get('token'), 'new-player-token');
    assert.equal(JSON.parse(state.storage.get('user')).id, 22);
    assert.deepEqual(state.redirects, []);
  });
}

test('a username edit updates the user cache used when returning to the game', async () => {
  const state = browser({ fetcher: async () => response(200, { username: 'New username' }) });
  await state.data.requestProfile('saved-token', 'New username');
  assert.equal(state.requests[0].options.method, 'PATCH');
  assert.equal(JSON.parse(state.requests[0].options.body).username, 'New username');
  assert.deepEqual(JSON.parse(state.storage.get('user')), { ...player, username: 'New username' });
});

for (const page of ['profile.js', 'history.js']) {
  test(`${page} redirects unauthenticated visitors without making an API request`, () => {
    const state = browser({ token: null });
    state.run(page);
    assert.deepEqual(state.redirects, ['login.html']);
    assert.equal(state.requests.length, 0);
  });

  test(`${page} keeps the session when navigating back and clears account data on logout in another tab`, async () => {
    const state = browser();
    state.run(page);
    await settle();
    assert.deepEqual(state.redirects, []);
    assert.equal(state.element('profile-header-score').textContent, '80');
    state.listeners.get('pageshow')({ persisted: true });
    await settle();
    assert.equal(state.requests.length, 2);
    assert.equal(state.storage.get('token'), 'saved-token');
    state.storage.delete('token');
    state.storage.delete('user');
    state.listeners.get('storage')({ key: 'token' });
    await settle();
    assert.deepEqual(state.redirects, ['login.html']);
    assert.equal(state.element('profile-header-score').textContent, '5');
    assert.equal(state.element(page === 'profile.js' ? 'profile-email-row' : 'history-sources').hidden, true);
  });

  test(`${page} ignores a previous player's delayed response after switching accounts`, async () => {
    let finishOldRequest;
    const nextPlayer = { ...player, id: 22, username: 'Second player', total_points: 120 };
    const state = browser({ fetcher: (url, options) => options.headers.Authorization === 'Bearer saved-token'
      ? new Promise(resolve => { finishOldRequest = resolve; })
      : response(200, { profile: nextPlayer, sessions: [] }) });
    state.run(page);
    state.storage.set('token', 'new-player-token');
    state.listeners.get('storage')({ key: 'token' });
    await settle();
    assert.equal(state.element('profile-header-score').textContent, '120');
    finishOldRequest(response(200, { profile: player, sessions }));
    await settle();
    assert.equal(state.element('profile-header-score').textContent, '120');
    assert.equal(JSON.parse(state.storage.get('user')).id, 22);
    assert.deepEqual(state.redirects, []);
  });
}
