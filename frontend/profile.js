(() => {
  const gameStorageKey = '7ajayatna_state';
  const tokenStorageKey = 'token';
  const imageStoragePrefix = '7ajayatna_profile_images:';
  const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const maxImageBytes = 15 * 1024 * 1024;
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
  const imagesDialog = element('images-dialog');
  const saveImages = element('images-save');
  const imageFields = [
    { kind: 'avatar', width: 256, height: 256 },
    { kind: 'cover', width: 1440, height: 480 }
  ].map(field => {
    const image = element(`${field.kind}-image`);
    return {
      ...field,
      image,
      trigger: element(`edit-${field.kind}`),
      defaultSource: image.getAttribute('src'),
      fileInput: element(`${field.kind}-file`),
      preview: element(`${field.kind}-preview`),
      reset: element(`${field.kind}-reset`),
      saved: null,
      pending: null
    };
  });
  const editButtons = [edit, ...imageFields.map(field => field.trigger)];
  let imageChanges = {};
  let imageEditKey;
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

  function profileImageKey() {
    const email = account?.profile.email;
    return `${imageStoragePrefix}${email ? `account:${email}` : 'guest'}`;
  }

  function readImages(key) {
    const images = {};
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      for (const { kind } of imageFields) {
        const source = stored?.[kind];
        if (typeof source === 'string' && /^data:image\/(?:webp|jpeg);base64,/.test(source)) {
          images[kind] = source;
        }
      }
    } catch {
      // Show the default art if browser storage is unavailable or invalid.
    }
    return images;
  }

  function renderImages() {
    const images = readImages(profileImageKey());
    for (const field of imageFields) {
      const source = images[field.kind] || field.defaultSource;
      if (field.image.getAttribute('src') !== source) field.image.src = source;
    }
  }

  async function prepareImage(file, { width, height }) {
    const bitmap = await createImageBitmap(file);
    try {
      const cropScale = Math.min(bitmap.width / width, bitmap.height / height);
      const cropWidth = width * cropScale;
      const cropHeight = height * cropScale;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(Math.min(width, cropWidth)));
      canvas.height = Math.max(1, Math.round(Math.min(height, cropHeight)));
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, (bitmap.width - cropWidth) / 2, (bitmap.height - cropHeight) / 2,
        cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL('image/webp', 0.85);
      if (webp.startsWith('data:image/webp;')) return webp;

      context.globalCompositeOperation = 'destination-over';
      context.fillStyle = '#fffdf7';
      context.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
      bitmap.close();
    }
  }

  function setImagePreview(field, source) {
    field.preview.src = source || field.defaultSource;
    field.reset.hidden = !source;
  }

  function updateImageSave() {
    saveImages.disabled = Object.keys(imageChanges).length === 0 || imageFields.some(field => field.pending);
  }

  function setImageMessage(field, message = '', invalid = false) {
    setText(`${field.kind}-message`, message);
    if (invalid) field.fileInput.setAttribute('aria-invalid', 'true');
    else field.fileInput.removeAttribute('aria-invalid');
  }

  async function selectImage(field) {
    const file = field.fileInput.files[0];
    if (!file) return;
    field.pending = file;
    setText('images-message', '');
    setImageMessage(field, 'Préparation de l’aperçu…');
    updateImageSave();

    let source;
    let error = '';
    if (!imageTypes.has(file.type)) {
      error = 'Choisissez une image JPG, PNG ou WebP.';
    } else if (file.size > maxImageBytes) {
      error = 'Cette image dépasse 15 Mo.';
    } else {
      try {
        source = await prepareImage(file, field);
      } catch {
        error = 'Impossible de lire cette image. Choisissez un autre fichier.';
      }
    }

    if (!imagesDialog.open || field.pending !== file) return;
    field.pending = null;
    setImageMessage(field, error, Boolean(error));
    if (error) {
      field.fileInput.value = '';
    } else {
      imageChanges[field.kind] = source;
      setImagePreview(field, source);
    }
    updateImageSave();
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

    renderImages();
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

    for (const button of editButtons) button.disabled = true;
    setText('account-note', 'Chargement de votre compte…');
    try {
      const current = await requestProfile(token);
      if (typeof current.profile?.username !== 'string') throw new Error('Réponse inattendue.');
      account = current;
      accountToken = token;
    } catch {
      accountWarning = 'Compte indisponible. La progression affichée vient de cet appareil.';
    } finally {
      for (const button of editButtons) button.disabled = false;
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

  function openImageEditor(selectedField) {
    imageEditKey = profileImageKey();
    const images = readImages(imageEditKey);
    imageChanges = {};
    setText('images-message', '');
    for (const field of imageFields) {
      field.saved = images[field.kind];
      field.pending = null;
      field.fileInput.value = '';
      setImageMessage(field);
      setImagePreview(field, field.saved);
    }
    updateImageSave();
    imagesDialog.showModal();
    selectedField.fileInput.focus();
  }

  element('images-cancel').addEventListener('click', () => imagesDialog.close());
  for (const field of imageFields) {
    field.trigger.addEventListener('click', () => openImageEditor(field));
    field.fileInput.addEventListener('change', () => selectImage(field));
    field.reset.addEventListener('click', () => {
      field.pending = null;
      field.fileInput.value = '';
      if (field.saved) imageChanges[field.kind] = null;
      else delete imageChanges[field.kind];
      setImageMessage(field);
      setText('images-message', '');
      setImagePreview(field, null);
      updateImageSave();
      field.fileInput.focus();
    });
  }

  element('images-form').addEventListener('submit', event => {
    event.preventDefault();
    if (saveImages.disabled) return;
    if (account && readToken() !== accountToken) {
      setText('images-message', 'La session a changé. Rechargez la page.');
      return;
    }

    try {
      const images = readImages(imageEditKey);
      for (const [kind, source] of Object.entries(imageChanges)) {
        if (source) images[kind] = source;
        else delete images[kind];
      }
      if (Object.keys(images).length) localStorage.setItem(imageEditKey, JSON.stringify(images));
      else localStorage.removeItem(imageEditKey);
    } catch {
      setText('images-message', 'Impossible d’enregistrer les images dans ce navigateur.');
      return;
    }

    imagesDialog.close();
    renderImages();
    setText('account-note', 'Images enregistrées.');
  });

  window.addEventListener('storage', event => {
    if (event.key === gameStorageKey && !account) render();
    if (event.key === profileImageKey() || event.key === null) renderImages();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    if (account) renderImages();
    else render();
  });

  load();
})();
