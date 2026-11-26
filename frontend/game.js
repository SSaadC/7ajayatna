// ==========================================================================
//  7AJAYATNA (حجاياتنا) – MOTEUR DE JEU & ÉVALUATION INTELLIGENTE
//  Projet INPT - Module PPP : Préservation du patrimoine marocain
// ==========================================================================

/* --------------------------------------------------------------------------
   1. MODULE D'ÉVALUATION INTELLIGENTE (Normalisation Darija, Règles & Tolérance)
   -------------------------------------------------------------------------- */
const DarijaEvaluator = {
  // Supprime accents, ponctuation, et normalise la casse
  cleanString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlève accents
      .replace(/['’\-_\.,;:\?!]/g, ' ')                  // Remplace ponctuation par espace
      .replace(/\s+/g, ' ')                             // Espaces multiples -> 1 espace
      .trim();
  },

  // Normalisation phonétique Darija (Arabizi + Articles)
  canonicalize(str) {
    let s = this.cleanString(str);

    // Retirer les articles définis en français ou en darija
    const prefixes = [
      /^l\s+/, /^el\s+/, /^al\s+/, /^le\s+/, /^la\s+/, /^les\s+/, /^un\s+/, /^une\s+/,
      /^l'/, /^d'/, /^ال/, /^و/
    ];
    for (const prefix of prefixes) {
      s = s.replace(prefix, '');
    }

    // Normalisation des chiffres Arabizi usuels
    // 3 = ع (ayn), 7 = ح (ha), 9 = ق (qaf), 5 = خ (kha)
    s = s.replace(/3/g, 'e')
         .replace(/7/g, 'h')
         .replace(/9/g, 'q')
         .replace(/5/g, 'kh')
         .replace(/ou/g, 'u')
         .replace(/oo/g, 'u')
         .replace(/ch/g, 'sh')
         .replace(/(\w)\1+/g, '$1'); // Réduit les lettres répétées : "mchhhhet" -> "mchet"

    return s.trim();
  },

  // Calcul de la distance de Levenshtein pour tolérer les fautes de frappe légères
  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // suppression
          );
        }
      }
    }
    return matrix[b.length][a.length];
  },

  // Évaluation d'une réponse utilisateur
  evaluate(userInput, question) {
    if (!userInput || !userInput.trim()) {
      return { verdict: 'incorrect', confidence: 0, reason: 'Réponse vide' };
    }

    const rawInput = this.cleanString(userInput);
    const canonInput = this.canonicalize(userInput);

    // 1. Comparaison directe avec toutes les variantes déclarées
    for (const variant of question.variants) {
      const rawVariant = this.cleanString(variant);
      const canonVariant = this.canonicalize(variant);

      if (rawInput === rawVariant || canonInput === canonVariant) {
        return {
          verdict: 'correct',
          confidence: 1.0,
          matchType: 'exact_or_variant',
          matchedVariant: variant
        };
      }
    }

    // 2. Tolérance aux fautes de frappe (distance de Levenshtein)
    for (const variant of question.variants) {
      const canonVariant = this.canonicalize(variant);
      const dist = this.levenshtein(canonInput, canonVariant);
      const threshold = canonVariant.length > 5 ? 2 : 1;

      if (dist <= threshold) {
        return {
          verdict: 'correct',
          confidence: 0.88,
          matchType: 'fuzzy_levenshtein',
          matchedVariant: variant,
          note: 'Accepté malgré une légère différence d’orthographe'
        };
      }
    }

    // 3. Hook pour l'appel futur de l'API IA (Edge function Gemini côté serveur)
    // Permet à l'équipe backend de brancher POST /api/evaluate directement ici
    return {
      verdict: 'incorrect',
      confidence: 0.15,
      matchType: 'none',
      aiFallbackReady: true // Signal que ce cas peut être transmis à Gemini
    };
  }
};

/* --------------------------------------------------------------------------
   2. EFFETS SONORES AVEC WEB AUDIO API (Aucun fichier externe requis)
   -------------------------------------------------------------------------- */
const SoundEffects = {
  ctx: null,
  muted: false,

  init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('Audio non disponible', e);
    }
  },

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playSuccess() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);        // A4
    osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
    osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
    osc.frequency.setValueAtTime(880, now + 0.3);    // A5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  },

  playWrong() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.3);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  },

  playTick() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  },

  playVictory() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.4);
    });
  }
};

/* --------------------------------------------------------------------------
   3. GESTION DU CONFETTI (Animation festive pour victoire de niveau)
   -------------------------------------------------------------------------- */
const ConfettiEngine = {
  canvas: null,
  ctx: null,
  particles: [],
  animId: null,

  init() {
    this.canvas = document.getElementById('confettiCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  fire(count = 90) {
    if (!this.canvas) return;
    const colors = ['#2A9D8F', '#E76F51', '#F4A261', '#E9C46A', '#264653', '#FFFFFF'];
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: this.canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1
      });
    }

    if (this.animId) cancelAnimationFrame(this.animId);
    this.render();
  },

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let activeCount = 0;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravité
      p.rotation += p.rotSpeed;
      p.alpha -= 0.008;

      if (p.alpha > 0) {
        activeCount++;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.3);
        this.ctx.restore();
      }
    }

    if (activeCount > 0) {
      this.animId = requestAnimationFrame(() => this.render());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};

/* --------------------------------------------------------------------------
   4. CONTRÔLEUR PRINCIPAL DU JEU 7AJAYATNA
   -------------------------------------------------------------------------- */
const App = {
  // État du joueur et progression
  state: {
    playerName: 'Joueur',
    totalScore: 0,
    unlockedLevels: [1],      // Niveau 1 toujours débloqué
    completedLevels: [],
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    history: []
  },

  // Session de jeu en cours
  session: {
    levelId: 1,
    gameMode: 'quiz', // 'quiz', 'fill', 'mixed'
    questions: [],
    currentIndex: 0,
    levelScore: 0,
    correctInLevel: 0,
    hintUsedCurrent: false,
    timer: null,
    timeLeft: 30,
    startTime: null,
    totalTimeSpent: 0
  },

  init() {
    // Vérifier l'authentification JWT avant d'autoriser l'accès au jeu
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      window.location.href = 'login.html';
      return;
    }

    const currentUser = JSON.parse(userStr);
    this.state.playerName = currentUser.username;
    this.state.totalScore = currentUser.total_points || 0;

    this.loadState();
    // Forcer le vrai nom d'utilisateur issu de MySQL
    this.state.playerName = currentUser.username;

    SoundEffects.init();
    ConfettiEngine.init();
    this.renderLevelsGrid();
    this.updateStatsUI();
    this.bindEvents();
  },

  // Persistance dans localStorage (facile à relier à Supabase Auth plus tard)
  saveState() {
    try {
      localStorage.setItem('7ajayatna_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Impossible de sauvegarder', e);
    }
  },

  loadState() {
    try {
      const saved = localStorage.getItem('7ajayatna_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('Erreur lecture stockage', e);
    }

    const nameInput = document.getElementById('playerName');
    if (nameInput && this.state.playerName) {
      nameInput.value = this.state.playerName;
    }
  },

  bindEvents() {
    // Changement de nom
    const btnSaveName = document.getElementById('btnStartSetup');
    if (btnSaveName) {
      btnSaveName.addEventListener('click', () => {
        const input = document.getElementById('playerName');
        if (input && input.value.trim()) {
          this.state.playerName = input.value.trim();
          this.saveState();
          this.showToast(`Bienvenue, ${this.state.playerName} ! 🇲🇦`);
        }
      });
    }
    // Déconnexion
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });

    // Boutons de retour
    document.getElementById('btnBackToHome')?.addEventListener('click', () => this.switchScreen('screenHome'));
    document.getElementById('btnQuitGame')?.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment quitter la partie en cours ?')) {
        clearInterval(this.session.timer);
        this.switchScreen('screenHome');
      }
    });

    // Choix du mode de jeu
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        this.startLevelSession(this.session.levelId, mode);
      });
    });

    // Saisie libre : validation par bouton et touche Entrée
    const fillInput = document.getElementById('fillInput');
    const btnSubmitFill = document.getElementById('btnSubmitFill');

    btnSubmitFill?.addEventListener('click', () => this.submitFillAnswer());
    fillInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitFillAnswer();
      }
    });

    // Boutons virtuels d'Arabizi (facilite la saisie de 3, 7, 9 sur mobile ou PC)
    document.querySelectorAll('.arabizi-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const char = btn.dataset.char;
        if (fillInput) {
          fillInput.value += char;
          fillInput.focus();
        }
      });
    });

    // Boutons options QCM
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        this.submitQuizAnswer(idx);
      });
    });

    // Bouton question suivante
    document.getElementById('btnNext')?.addEventListener('click', () => this.nextQuestion());

    // Bouton indice
    document.getElementById('btnUseHint')?.addEventListener('click', () => this.useHint());

    // Boutons de l'écran résultat
    document.getElementById('btnReplay')?.addEventListener('click', () => {
      this.startLevelSession(this.session.levelId, this.session.gameMode);
    });
    document.getElementById('btnReturnHome')?.addEventListener('click', () => {
      this.renderLevelsGrid();
      this.updateStatsUI();
      this.switchScreen('screenHome');
    });

    // Toggle Son
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        SoundEffects.muted = !SoundEffects.muted;
        soundToggle.textContent = SoundEffects.muted ? '🔇' : '🔊';
        soundToggle.title = SoundEffects.muted ? 'Activer le son' : 'Couper le son';
      });
    }

    // Modal Historique
    document.getElementById('btnOpenHistory')?.addEventListener('click', () => this.openHistoryModal());
    document.getElementById('btnCloseHistory')?.addEventListener('click', () => this.closeHistoryModal());
  },

  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  // Rendu de la grille des 3 niveaux
  renderLevelsGrid() {
    const grid = document.getElementById('levelsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    LEVELS_DATA.forEach(level => {
      const isUnlocked = this.state.unlockedLevels.includes(level.id);
      const isCompleted = this.state.completedLevels.includes(level.id);

      const card = document.createElement('div');
      card.className = `level-card lvl-${level.id} ${isUnlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        ${isCompleted ? '<span class="level-completed-badge">✓ Validé</span>' : ''}
        <div class="level-num">${level.id}</div>
        <div class="level-name">${level.title}</div>
        <div class="level-darija">${level.darijaTitle}</div>
        <div class="level-desc">${level.subtitle}</div>
        <div class="level-meta">
          <span>🧩 ${level.questions.length} devinettes</span>
          <span>⏱ ${level.timePerQuestion}s / devinette</span>
        </div>
        ${!isUnlocked ? `
          <div class="level-lock-info">
            <span class="level-lock">🔒</span>
            <span class="level-lock-label">Déblocage à ${level.unlockScore} pts</span>
          </div>
        ` : `
          <button class="btn btn-level-play">Jouer maintenant</button>
        `}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => this.openModeSelect(level.id));
      } else {
        card.addEventListener('click', () => {
          this.showToast(`🔒 Atteins ${level.unlockScore} points pour débloquer ce niveau !`);
          SoundEffects.playWrong();
        });
      }

      grid.appendChild(card);
    });
  },

  openModeSelect(levelId) {
    this.session.levelId = levelId;
    const level = getLevelById(levelId);
    const badge = document.getElementById('modeLevelBadge');
    if (badge) {
      badge.textContent = `${level.title} (${level.darijaTitle})`;
      badge.style.borderColor = level.color;
      badge.style.color = level.color;
    }
    this.switchScreen('screenMode');
  },

  startLevelSession(levelId, mode) {
    const level = getLevelById(levelId);
    this.session.levelId = levelId;
    this.session.gameMode = mode;
    this.session.questions = [...level.questions].sort(() => Math.random() - 0.5);
    this.session.currentIndex = 0;
    this.session.levelScore = 0;
    this.session.correctInLevel = 0;
    this.session.hintUsedCurrent = false;
    this.session.totalTimeSpent = 0;

    this.switchScreen('screenGame');
    this.loadQuestion(0);
  },

  loadQuestion(index) {
    clearInterval(this.session.timer);
    const q = this.session.questions[index];
    const level = getLevelById(this.session.levelId);
    this.session.hintUsedCurrent = false;

    // Mise à jour de la barre de progression
    const totalQ = this.session.questions.length;
    const progressPct = ((index) / totalQ) * 100;
    const progressBar = document.getElementById('gameProgressBar');
    if (progressBar) progressBar.style.width = `${progressPct}%`;

    // Titres et métadonnées
    document.getElementById('questionNum').textContent = `Devinette ${index + 1} / ${totalQ}`;
    document.getElementById('qCategory').textContent = `${q.category} · 📍 ${q.region}`;
    document.getElementById('gameScoreDisplay').textContent = this.state.totalScore + this.session.levelScore;
    document.getElementById('streakDisplay').textContent = this.state.streak;

    // Détermination du format d'affichage (Quiz vs Saisie libre)
    let currentMode = this.session.gameMode;
    if (currentMode === 'mixed') {
      currentMode = index % 2 === 0 ? 'quiz' : 'fill';
    }

    const typeBadge = document.getElementById('qTypeBadge');
    typeBadge.textContent = currentMode === 'quiz' ? 'QCM (4 Choix)' : 'Saisie libre / Darija';

    // Textes de la devinette
    document.getElementById('qDarija').textContent = q.darija;
    document.getElementById('qArabic').textContent = q.arabic;
    document.getElementById('qFrench').textContent = q.french;

    // Cacher l'indice précédent
    const hintBox = document.getElementById('hintDisplayBox');
    hintBox.classList.remove('show');
    hintBox.textContent = '';
    const btnHint = document.getElementById('btnUseHint');
    if (btnHint) {
      btnHint.disabled = false;
      btnHint.innerHTML = '💡 Demander un indice <span class="hint-cost">(-2 pts)</span>';
    }

    // Réinitialiser les overlays de feedback
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    feedbackOverlay.classList.remove('show');

    // Configuration des interfaces selon le mode
    const quizArea = document.getElementById('quizOptions');
    const fillArea = document.getElementById('fillMode');

    if (currentMode === 'quiz') {
      quizArea.style.display = 'grid';
      fillArea.style.display = 'none';

      // Mélanger la bonne réponse et les 3 distracteurs
      const allChoices = [q.displayAnswer, ...q.distractors].sort(() => Math.random() - 0.5);
      const optionButtons = quizArea.querySelectorAll('.option-btn');

      optionButtons.forEach((btn, i) => {
        btn.textContent = allChoices[i];
        btn.className = 'option-btn';
        btn.disabled = false;
        btn.dataset.isCorrect = (allChoices[i] === q.displayAnswer) ? 'true' : 'false';
      });
    } else {
      quizArea.style.display = 'none';
      fillArea.style.display = 'block';

      const fillInput = document.getElementById('fillInput');
      fillInput.value = '';
      fillInput.disabled = false;
      fillInput.focus();
    }

    // Démarrage du chronomètre
    this.session.timeLeft = level.timePerQuestion;
    this.session.startTime = Date.now();
    this.updateTimerDisplay();

    this.session.timer = setInterval(() => {
      this.session.timeLeft--;
      this.updateTimerDisplay();

      if (this.session.timeLeft <= 5 && this.session.timeLeft > 0) {
        SoundEffects.playTick();
      }

      if (this.session.timeLeft <= 0) {
        clearInterval(this.session.timer);
        this.handleTimeOut();
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const el = document.getElementById('timerDisplay');
    if (el) {
      el.textContent = `${this.session.timeLeft}s`;
      if (this.session.timeLeft <= 5) {
        el.parentElement.classList.add('urgent');
      } else {
        el.parentElement.classList.remove('urgent');
      }
    }
  },

  useHint() {
    if (this.session.hintUsedCurrent) return;
    const q = this.session.questions[this.session.currentIndex];
    this.session.hintUsedCurrent = true;

    const hintBox = document.getElementById('hintDisplayBox');
    hintBox.textContent = `💡 Indice culturel : ${q.hint}`;
    hintBox.classList.add('show');

    const btnHint = document.getElementById('btnUseHint');
    if (btnHint) {
      btnHint.disabled = true;
      btnHint.textContent = 'Indice utilisé (-2 pts)';
    }

    this.showToast('Indice dévoilé (-2 points sur cette devinette)');
  },

  submitQuizAnswer(selectedIdx) {
    clearInterval(this.session.timer);
    const quizArea = document.getElementById('quizOptions');
    const buttons = quizArea.querySelectorAll('.option-btn');
    const selectedBtn = buttons[selectedIdx];
    const isCorrect = selectedBtn.dataset.isCorrect === 'true';

    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.isCorrect === 'true') {
        btn.classList.add('correct');
      } else if (btn === selectedBtn) {
        btn.classList.add('wrong');
      }
    });

    this.processResult(isCorrect, isCorrect ? 1.0 : 0, isCorrect ? 'QCM Correct' : 'Choix incorrect');
  },

  submitFillAnswer() {
    const input = document.getElementById('fillInput');
    const userText = input.value.trim();
    if (!userText) {
      this.showToast('Veuillez saisir votre réponse !');
      input.focus();
      return;
    }

    clearInterval(this.session.timer);
    input.disabled = true;

    const q = this.session.questions[this.session.currentIndex];
    const evalResult = DarijaEvaluator.evaluate(userText, q);
    const isCorrect = evalResult.verdict === 'correct';

    this.processResult(isCorrect, evalResult.confidence, evalResult.note || userText);
  },

  handleTimeOut() {
    this.showToast('⏰ Temps écoulé !');
    const quizArea = document.getElementById('quizOptions');
    const buttons = quizArea.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.isCorrect === 'true') btn.classList.add('correct');
    });

    const fillInput = document.getElementById('fillInput');
    if (fillInput) fillInput.disabled = true;

    this.processResult(false, 0, 'Temps écoulé');
  },

  processResult(isCorrect, confidence, detail) {
    const q = this.session.questions[this.session.currentIndex];
    const timeSpent = Math.max(1, Math.round((Date.now() - this.session.startTime) / 1000));
    this.session.totalTimeSpent += timeSpent;

    let pointsEarned = 0;

    if (isCorrect) {
      SoundEffects.playSuccess();
      this.state.streak++;
      if (this.state.streak > this.state.bestStreak) {
        this.state.bestStreak = this.state.streak;
      }

      // Calcul des points : base 10 pts + bonus vitesse + combo streak - pénalité indice
      let base = 10;
      let speedBonus = Math.max(0, Math.floor((this.session.timeLeft / 5)));
      let streakBonus = this.state.streak >= 3 ? 5 : 0;
      let hintPenalty = this.session.hintUsedCurrent ? 2 : 0;

      pointsEarned = Math.max(5, base + speedBonus + streakBonus - hintPenalty);

      this.session.levelScore += pointsEarned;
      this.session.correctInLevel++;
      this.state.totalCorrect++;
    } else {
      SoundEffects.playWrong();
      this.state.streak = 0;
      pointsEarned = 0;
    }

    this.state.totalAnswered++;

    // Enregistrement dans l'historique
    this.state.history.unshift({
      questionText: q.darija,
      solution: q.displayAnswer,
      isCorrect,
      points: pointsEarned,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (this.state.history.length > 50) this.state.history.pop();

    this.updateStatsUI();
    this.showFeedbackOverlay(isCorrect, pointsEarned, q);
  },

  showFeedbackOverlay(isCorrect, points, q) {
    const overlay = document.getElementById('feedbackOverlay');
    const icon = document.getElementById('feedbackIcon');
    const title = document.getElementById('feedbackText');
    const pts = document.getElementById('feedbackPoints');
    const expl = document.getElementById('feedbackExplanation');
    const solutionText = document.getElementById('feedbackSolution');

    if (isCorrect) {
      icon.textContent = '✨ 🇲🇦 ✨';
      title.textContent = 'Bravo ! Sa7i7 (صحيح)';
      title.className = 'feedback-text text-success';
      pts.textContent = `+${points} points gagnés !`;
      if (this.state.streak >= 2) pts.textContent += ` 🔥 Série x${this.state.streak}`;
    } else {
      icon.textContent = '❌';
      title.textContent = 'Khatâ (خطأ) – Pas tout à fait !';
      title.className = 'feedback-text text-danger';
      pts.textContent = '+0 point';
    }

    solutionText.innerHTML = `<strong>Solution officielle :</strong> ${q.displayAnswer}`;
    expl.innerHTML = `
      <div class="culture-box">
        <div class="culture-badge">📖 Contexte & Culture (${q.region})</div>
        <p>${q.explanation}</p>
      </div>
    `;

    overlay.classList.add('show');
  },

  nextQuestion() {
    this.session.currentIndex++;
    if (this.session.currentIndex < this.session.questions.length) {
      this.loadQuestion(this.session.currentIndex);
    } else {
      this.finishLevel();
    }
  },

  finishLevel() {
    clearInterval(this.session.timer);
    const level = getLevelById(this.session.levelId);
    this.state.totalScore += this.session.levelScore;

    // Débloquer le niveau suivant si le score requis est atteint
    let unlockedNew = false;
    let newlyUnlockedLevel = null;

    LEVELS_DATA.forEach(lvl => {
      if (!this.state.unlockedLevels.includes(lvl.id) && this.state.totalScore >= lvl.unlockScore) {
        this.state.unlockedLevels.push(lvl.id);
        unlockedNew = true;
        newlyUnlockedLevel = lvl;
      }
    });

    if (!this.state.completedLevels.includes(level.id) && this.session.correctInLevel >= Math.ceil(level.questions.length * 0.6)) {
      this.state.completedLevels.push(level.id);
    }

    this.saveState();
    // Envoyer le score de la partie au backend Express + MySQL
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:3000/api/game/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          score_earned: this.session.levelScore,
          riddles_answered: this.session.questions.length
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.total_points !== undefined) {
          // Synchroniser le score officiel de MySQL dans le localStorage
          const user = JSON.parse(localStorage.getItem('user'));
          user.total_points = data.total_points;
          user.games_played = data.games_played;
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
      .catch(err => console.error('Erreur synchronisation MySQL:', err));
    }
    SoundEffects.playVictory();
    ConfettiEngine.fire(120);

    // Remplir l'écran résultat
    document.getElementById('resScore').textContent = `+${this.session.levelScore}`;
    document.getElementById('resCorrect').textContent = `${this.session.correctInLevel} / ${this.session.questions.length}`;

    const avgTime = Math.round(this.session.totalTimeSpent / this.session.questions.length);
    document.getElementById('resTime').textContent = `${avgTime}s`;
    document.getElementById('resBestStreak').textContent = `🔥 ${this.state.bestStreak}`;

    // Mention / Grade d'honneur
    const ratio = this.session.correctInLevel / this.session.questions.length;
    let grade = 'Élève du patrimoine';
    if (ratio === 1) grade = '🏆 Hakim / Maître des 7ajayat (100%)';
    else if (ratio >= 0.8) grade = '🌟 Expert du Patrimoine';
    else if (ratio >= 0.5) grade = '👍 Bon Connaisseur';
    document.getElementById('resultGrade').textContent = grade;

    // Affichage de la bannière de déblocage
    const unlockBanner = document.getElementById('unlockBanner');
    if (unlockedNew && newlyUnlockedLevel) {
      unlockBanner.style.display = 'flex';
      document.getElementById('unlockText').textContent = `Félicitations ! Tu as débloqué ${newlyUnlockedLevel.title} !`;
    } else {
      unlockBanner.style.display = 'none';
    }

    // Progression XP vers le niveau suivant
    const nextLocked = LEVELS_DATA.find(lvl => !this.state.unlockedLevels.includes(lvl.id));
    const xpFill = document.getElementById('xpBarFill');
    const xpLabel = document.getElementById('xpBarLabel');

    if (nextLocked) {
      const pct = Math.min(100, Math.round((this.state.totalScore / nextLocked.unlockScore) * 100));
      xpFill.style.width = `${pct}%`;
      xpLabel.textContent = `${this.state.totalScore} / ${nextLocked.unlockScore} pts pour débloquer ${nextLocked.badge}`;
    } else {
      xpFill.style.width = '100%';
      xpLabel.textContent = `Tous les niveaux débloqués ! Score total : ${this.state.totalScore} pts 🇲🇦`;
    }

    this.switchScreen('screenResult');
  },

  updateStatsUI() {
    const scoreVal = this.state.totalScore + (this.session?.levelScore || 0);
    document.getElementById('headerScore').textContent = scoreVal;
    document.getElementById('statTotalScore').textContent = this.state.totalScore;
    document.getElementById('statUnlocked').textContent = `${this.state.unlockedLevels.length} / 3`;
    document.getElementById('statStreak').textContent = `🔥 ${this.state.streak}`;

    const acc = this.state.totalAnswered > 0
      ? `${Math.round((this.state.totalCorrect / this.state.totalAnswered) * 100)}%`
      : '—';
    document.getElementById('statAccuracy').textContent = acc;
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  },

  openHistoryModal() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    if (!modal || !list) return;

    if (this.state.history.length === 0) {
      list.innerHTML = '<div class="empty-history">Aucune devinette jouée pour le moment. Lancez une partie !</div>';
    } else {
      list.innerHTML = this.state.history.map(item => `
        <div class="history-item ${item.isCorrect ? 'correct' : 'wrong'}">
          <div class="history-q">${item.questionText}</div>
          <div class="history-res">
            <span>${item.isCorrect ? '✓ Réussi' : '✗ Manqué'} (${item.solution})</span>
            <span class="history-pts">+${item.points} pts</span>
          </div>
        </div>
      `).join('');
    }
    modal.classList.add('show');
  },

  closeHistoryModal() {
    document.getElementById('historyModal')?.classList.remove('show');
  }
};

// Démarrage au chargement du DOM
document.addEventListener('DOMContentLoaded', () => App.init());
