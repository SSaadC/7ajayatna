(() => {
  const {
    gameStorageKey, tokenStorageKey, readGameState, readToken, count, formatDate, numberFormat, requestProfile
  } = ProfileData;
  const element = name => document.getElementById(`history-${name}`);
  const setText = (name, value) => { element(name).textContent = value; };
  const sourceButtons = [...element('sources').querySelectorAll('button')];
  const filterButtons = [...element('filters').querySelectorAll('button')];
  let source = 'device';
  let filter = 'all';
  let account = null;
  let accountUnavailable = false;
  let loadedToken = null;
  let requestId = 0;

  function currentToken() {
    return location.protocol === 'file:' ? null : readToken();
  }

  function records(value) {
    return Array.isArray(value) ? value.filter(entry => entry && typeof entry === 'object') : [];
  }

  function textElement(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function createEntry(entry, accountView) {
    const row = document.createElement('li');
    row.className = 'history-entry';
    const passed = entry.isCorrect === true;
    const mark = textElement('span', 'history-entry-mark', accountView ? '◆' : passed ? '✓' : '×');
    mark.setAttribute('aria-hidden', 'true');
    if (!accountView && !passed) mark.classList.add('history-entry-mark-missed');

    const details = document.createElement('div');
    const date = accountView ? formatDate(entry.played_at) : entry.date;
    const title = accountView
      ? (date === '—' ? 'Partie enregistrée' : `Partie du ${date}`)
      : (typeof entry.questionText === 'string' && entry.questionText.trim() ? entry.questionText : 'Devinette');
    const heading = textElement('p', 'history-entry-title', title);
    heading.dir = 'auto';
    details.append(heading);

    if (accountView) {
      const answered = count(entry.riddles_answered);
      details.append(textElement('p', 'history-entry-meta', `${numberFormat.format(answered)} ${answered === 1 ? 'réponse' : 'réponses'}`));
    } else {
      if (typeof entry.solution === 'string' && entry.solution.trim()) {
        const solution = textElement('p', 'history-entry-solution', `Réponse attendue · ${entry.solution}`);
        solution.dir = 'auto';
        details.append(solution);
      }
      const meta = document.createElement('p');
      meta.className = 'history-entry-meta';
      meta.append(textElement('span', '', passed ? 'Réussie' : 'Manquée'));
      if (typeof date === 'string' && date.trim()) meta.append(textElement('span', '', date));
      details.append(meta);
    }

    const points = count(accountView ? entry.score_earned : entry.points);
    row.append(mark, details, textElement('span', 'history-entry-points', `+${numberFormat.format(points)} pts`));
    return row;
  }

  function render() {
    const game = readGameState();
    const accountView = source === 'account' && Boolean(account);
    const entries = accountView ? records(account.sessions) : records(game.history);
    const points = count(accountView ? account.profile.total_points : game.totalScore);
    document.getElementById('profile-header-score').textContent = numberFormat.format(points);
    element('sources').hidden = !account;
    for (const button of sourceButtons) button.setAttribute('aria-pressed', String(button.dataset.source === source));

    const context = accountView ? 'Dernières parties enregistrées sur votre compte.' : 'Devinettes jouées sur cet appareil.';
    setText('context', accountUnavailable ? `Compte indisponible. ${context}` : context);
    element('accuracy-card').hidden = accountView;
    setText('total-label', accountView ? 'Parties jouées' : 'Devinettes jouées');
    setText('secondary-label', accountView ? 'Score cumulé' : 'Réponses réussies');

    if (accountView) {
      setText('total', numberFormat.format(count(account.profile.games_played)));
      setText('secondary', numberFormat.format(points));
    } else {
      const answered = Math.max(count(game.totalAnswered), entries.length);
      const correct = Math.min(answered, Math.max(count(game.totalCorrect), entries.filter(entry => entry.isCorrect === true).length));
      setText('total', numberFormat.format(answered));
      setText('secondary', numberFormat.format(correct));
      setText('accuracy', answered ? `${numberFormat.format(Math.round(correct / answered * 100))} %` : '—');
    }

    setText('list-title', accountView ? 'Parties enregistrées' : 'Devinettes jouées');
    element('filters').hidden = accountView || !entries.length;
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.result === filter));
    const visible = accountView || filter === 'all' ? entries : entries.filter(entry => (entry.isCorrect === true) === (filter === 'correct'));
    const noun = accountView ? 'partie' : 'devinette';
    setText('result-count', `${numberFormat.format(visible.length)} ${noun}${visible.length > 1 ? 's' : ''}`);

    const list = element('entries');
    list.replaceChildren(...visible.map(entry => createEntry(entry, accountView)));
    list.hidden = !visible.length;
    element('empty').hidden = Boolean(visible.length);
    if (visible.length) return;

    const noMatch = !accountView && Boolean(entries.length);
    setText('empty-title', noMatch ? 'Aucune devinette pour ce filtre' : 'Votre historique est vide');
    setText('empty-description', noMatch
      ? 'Affichez toutes les devinettes pour retrouver vos réponses.'
      : accountView ? 'Les parties enregistrées sur votre compte apparaîtront ici.'
        : 'Les devinettes apparaîtront ici après votre première partie terminée.');
    element('play').hidden = noMatch || accountView;
    element('clear-filters').hidden = !noMatch;
  }

  async function loadAccount() {
    const id = ++requestId;
    const token = currentToken();
    loadedToken = token;
    account = null;
    accountUnavailable = false;
    source = 'device';
    render();
    if (!token) return;

    try {
      const result = await requestProfile(token);
      if (id !== requestId) return;
      if (typeof result.profile?.username !== 'string') throw new Error('Réponse inattendue.');
      account = result;
    } catch {
      if (id !== requestId) return;
      accountUnavailable = true;
    }
    render();
  }

  for (const button of sourceButtons) {
    button.addEventListener('click', () => {
      source = button.dataset.source;
      render();
    });
  }
  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      filter = button.dataset.result;
      render();
    });
  }
  element('clear-filters').addEventListener('click', () => {
    filter = 'all';
    render();
    filterButtons[0].focus();
  });

  window.addEventListener('storage', event => {
    if (event.key === null || event.key === tokenStorageKey) loadAccount();
    else if (event.key === gameStorageKey) render();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    if (currentToken() !== loadedToken) loadAccount();
    else render();
  });

  loadAccount();
})();
