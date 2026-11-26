const ProfileData = (() => {
  const gameStorageKey = '7ajayatna_state';
  const tokenStorageKey = 'token';
  const loopbackHosts = ['localhost', '127.0.0.1', '[::1]'];
  const profileApi = loopbackHosts.includes(location.hostname) && location.protocol === 'http:'
    ? `http://${location.hostname}:3000/api/profile`
    : '/api/profile';
  const numberFormat = new Intl.NumberFormat('fr-MA');
  const dateFormat = new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' });
  let redirectingToLogin = false;

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

  function goToLogin() {
    if (redirectingToLogin) return;
    redirectingToLogin = true;
    location.replace('login.html');
  }

  function requireSession() {
    const token = readToken();
    if (!token) goToLogin();
    return token;
  }

  function sessionError() {
    const error = new Error('Votre session a changé ou a expiré. Reconnectez-vous.');
    error.name = 'ProfileSessionError';
    return error;
  }

  function expireSession(token) {
    // An old request must never sign out a player who just logged in again.
    if (readToken() !== token) return;
    try {
      localStorage.removeItem(tokenStorageKey);
      localStorage.removeItem('user');
    } catch {
      // Redirect even if browser storage is unavailable.
    }
    goToLogin();
  }

  function updateStoredUser(values) {
    if (typeof values?.username !== 'string') return;
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      const previous = stored && typeof stored === 'object' && !Array.isArray(stored)
        && (values.id === undefined || stored.id === values.id) ? stored : {};
      localStorage.setItem('user', JSON.stringify({ ...previous, ...values }));
    } catch {
      // Profile access still works when the optional user cache cannot be updated.
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
    if (!token || readToken() !== token) {
      requireSession();
      throw sessionError();
    }
    const headers = { Authorization: `Bearer ${token}` };
    const options = { headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(7000) };
    if (username !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.method = 'PATCH';
      options.body = JSON.stringify({ username });
    }

    const response = await fetch(profileApi, options);
    if (readToken() !== token) throw sessionError();
    if (response.status === 401 || response.status === 403) {
      expireSession(token);
      throw sessionError();
    }
    const result = await response.json();
    if (readToken() !== token) throw sessionError();
    if (!response.ok) throw new Error(result.message || 'Le compte est indisponible.');
    updateStoredUser(username === undefined ? result.profile : { username: result.username });
    return result;
  }

  return { gameStorageKey, tokenStorageKey, readGameState, readToken, requireSession, count, formatDate, numberFormat, requestProfile };
})();
