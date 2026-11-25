(() => {
  const gameStorageKey = '7ajayatna_state';
  const tokenStorageKey = 'token';
  const loopbackHosts = ['localhost', '127.0.0.1', '[::1]'];
  const profileApi = loopbackHosts.includes(location.hostname) && location.protocol === 'http:'
    ? `http://${location.hostname}:3000/api/profile`
    : '/api/profile';
  const numberFormat = new Intl.NumberFormat('fr-MA');
  const dateFormat = new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' });
  const element = id => document.getElementById(`profile-${id}`);
  const setText = (id, value) => { element(id).textContent = value; };
  const dialog = element('dialog');
  const input = element('username');
  const edit = element('edit');
  const save = element('save');
  const cancel = element('cancel');
  let account = null;
  let accountToken = null;
  let accountWarning = '';

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

  function render() {
    const game = account ? null : readGameState();
    const profile = account?.profile;
    const localName = typeof game?.playerName === 'string' ? game.playerName.trim() : '';
    const name = profile?.username || localName || 'Joueur';
    const points = count(profile?.total_points ?? game?.totalScore);
    const unlocked = profile
      ? LEVELS_DATA.filter(level => points >= level.unlockScore).map(level => level.id)
      : game.unlockedLevels;
    const openLevels = LEVELS_DATA.filter(level => level.unlockScore === 0 || (
      Array.isArray(unlocked) ? unlocked.includes(level.id) : points >= level.unlockScore
    ));
    const next = LEVELS_DATA.find(level => !openLevels.includes(level));
    const answered = count(game?.totalAnswered);
    const correct = Math.min(answered, count(game?.totalCorrect));

    setText('name', name);
    setText('detail-name', name);
    setText('account-type', profile ? 'Compte joueur' : 'Profil local');
    setText('detail-type', profile ? 'Compte 7ajayatna' : 'Invité');
    setText('account-note', profile
      ? 'Consultez la progression de votre compte.'
      : accountWarning || 'Votre progression est enregistrée sur cet appareil.');
    element('email-row').hidden = !profile;
    element('joined-row').hidden = !profile;
    setText('email', profile?.email || '—');
    setText('joined', formatDate(profile?.created_at));

    setText('points', numberFormat.format(points));
    setText('level-count', `${openLevels.length} / ${LEVELS_DATA.length}`);
    setText('stat-label', profile ? 'Parties jouées' : 'Réussite');
    setText('stat-value', profile
      ? numberFormat.format(count(profile.games_played))
      : answered ? `${Math.round(correct / answered * 100)} %` : '—');
    setText('milestone-label', next ? 'Prochain niveau' : 'Tous les niveaux');
    setText('milestone-title', next ? next.title.split(' : ').at(-1) : 'Tout est débloqué');
    setText('milestone-detail', next
      ? `${numberFormat.format(points)} / ${numberFormat.format(next.unlockScore)} points`
      : `${numberFormat.format(points)} points cumulés`);
    const progress = element('level-progress');
    progress.max = next?.unlockScore ?? 1;
    progress.value = next ? Math.min(points, progress.max) : 1;
    progress.setAttribute('aria-label', next ? 'Progression vers le prochain niveau' : 'Tous les niveaux débloqués');

    renderActivity(profile ? account.sessions : game.history, Boolean(profile));
  }

  function renderActivity(entries, isAccount) {
    const list = element('activity-list');
    list.replaceChildren();
    setText('activity-description', isAccount ? 'Vos dernières parties' : 'Vos dernières devinettes');
    setText('empty', isAccount
      ? 'Les parties enregistrées sur votre compte apparaîtront ici.'
      : 'Vos premières réponses apparaîtront ici après une partie.');

    const recent = Array.isArray(entries) ? entries.filter(entry => entry && typeof entry === 'object').slice(0, 5) : [];
    for (const entry of recent) {
      const item = document.createElement('li');
      item.className = 'profile-activity-item';
      const mark = document.createElement('span');
      mark.className = 'profile-activity-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = isAccount ? '◆' : entry.isCorrect ? '✓' : '×';
      if (!isAccount && !entry.isCorrect) mark.classList.add('profile-activity-mark-missed');

      const details = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'profile-activity-title';
      title.dir = 'auto';
      title.textContent = isAccount ? `Partie du ${formatDate(entry.played_at)}` : entry.questionText || 'Devinette';
      const meta = document.createElement('p');
      meta.className = 'profile-activity-meta';
      meta.textContent = isAccount
        ? `${numberFormat.format(count(entry.riddles_answered))} ${entry.riddles_answered === 1 ? 'réponse' : 'réponses'}`
        : [entry.isCorrect ? 'Réussie' : 'Manquée', entry.date].filter(Boolean).join(' · ');
      details.append(title, meta);

      const score = document.createElement('span');
      score.className = 'profile-activity-points';
      score.textContent = `+${numberFormat.format(count(isAccount ? entry.score_earned : entry.points))} pts`;
      item.append(mark, details, score);
      list.append(item);
    }

    list.hidden = recent.length === 0;
    element('empty').hidden = recent.length !== 0;
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

  async function load() {
    const token = location.protocol === 'file:' ? null : readToken();
    if (!token) {
      render();
      return;
    }

    edit.disabled = true;
    setText('account-note', 'Chargement de votre compte…');
    try {
      const current = await requestProfile(token);
      if (typeof current.profile?.username !== 'string') throw new Error('Réponse inattendue.');
      account = current;
      accountToken = token;
    } catch {
      accountWarning = 'Compte indisponible. La progression affichée vient de cet appareil.';
    } finally {
      edit.disabled = false;
      render();
    }
  }

  function showFormError(message) {
    input.setAttribute('aria-invalid', 'true');
    setText('form-message', message);
  }

  edit.addEventListener('click', () => {
    input.maxLength = account ? 50 : 20;
    input.value = element('name').textContent;
    input.removeAttribute('aria-invalid');
    setText('form-message', '');
    dialog.showModal();
  });

  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => {
    if (save.disabled) event.preventDefault();
  });
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    setText('form-message', '');
  });

  element('form').addEventListener('submit', async event => {
    event.preventDefault();
    if (save.disabled) return;
    const username = input.value.trim();
    if (!username) {
      showFormError('Saisissez un pseudonyme.');
      input.focus();
      return;
    }

    save.disabled = cancel.disabled = input.disabled = true;
    let saved = false;
    try {
      if (account) {
        if (readToken() !== accountToken) throw new Error('La session a changé. Rechargez la page.');
        const updated = await requestProfile(accountToken, username);
        account.profile.username = updated.username;
      } else {
        const game = readGameState();
        localStorage.setItem(gameStorageKey, JSON.stringify({ ...game, playerName: username }));
      }
      saved = true;
    } catch (error) {
      showFormError(account && !(error instanceof TypeError || error instanceof SyntaxError) && error.name !== 'TimeoutError'
        ? error.message
        : 'Enregistrement impossible. Réessayez.');
    } finally {
      save.disabled = cancel.disabled = input.disabled = false;
    }

    if (saved) {
      dialog.close();
      render();
      setText('account-note', 'Pseudonyme enregistré.');
    } else {
      input.focus();
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === gameStorageKey && !account) render();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && !account) render();
  });

  load();
})();
