const ProfileData = (() => {
  const gameStorageKey = '7ajayatna_state';
  const tokenStorageKey = 'token';
  const loopbackHosts = ['localhost', '127.0.0.1', '[::1]'];
  const profileApi = loopbackHosts.includes(location.hostname) && location.protocol === 'http:'
    ? `http://${location.hostname}:3000/api/profile`
    : '/api/profile';
  const numberFormat = new Intl.NumberFormat('fr-MA');
  const dateFormat = new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' });

  function readGameState() {
    try {
      const saved = JSON.parse(localStorage.getItem(gameStorageKey));
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function readToken() {
    try {
      return localStorage.getItem(tokenStorageKey);
    } catch {
      return null;
    }
  }

  function count(value) {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? dateFormat.format(date) : '—';
  }

  async function requestProfile(token, username) {
    const headers = { Authorization: `Bearer ${token}` };
    const options = { headers, redirect: 'error', signal: AbortSignal.timeout(7000) };
    if (username !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.method = 'PATCH';
      options.body = JSON.stringify({ username });
    }

    const response = await fetch(profileApi, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Le compte est indisponible.');
    return result;
  }

  return { gameStorageKey, tokenStorageKey, readGameState, readToken, count, formatDate, numberFormat, requestProfile };
})();
