(() => {
  const storageKey = '7ajayatna_sound_muted';

  function readMuted() {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  }

  function saveMuted(muted) {
    try {
      localStorage.setItem(storageKey, String(muted));
    } catch {
      // The current page can still toggle its sound setting.
    }
  }

  function syncOnReturn(sync) {
    window.addEventListener('storage', event => {
      if (event.key === storageKey || event.key === null) sync();
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) sync();
    });
  }

  const profileToggle = document.getElementById('profile-sound');
  if (profileToggle) {
    function showPreference(muted) {
      profileToggle.setAttribute('aria-pressed', String(muted));
      profileToggle.title = muted ? 'Rétablir le son du jeu' : 'Couper le son du jeu';
    }

    profileToggle.addEventListener('click', () => {
      const muted = profileToggle.getAttribute('aria-pressed') !== 'true';
      saveMuted(muted);
      showPreference(muted);
    });
    const sync = () => showPreference(readMuted());
    sync();
    syncOnReturn(sync);
    return;
  }

  const gameToggle = document.getElementById('soundToggle');
  if (!gameToggle || typeof SoundEffects === 'undefined') return;

  // The game registers its sound button handler first on DOMContentLoaded.
  document.addEventListener('DOMContentLoaded', () => {
    let applyingPreference = false;
    gameToggle.setAttribute('aria-label', 'Couper le son du jeu');
    gameToggle.addEventListener('click', () => {
      gameToggle.setAttribute('aria-pressed', String(SoundEffects.muted));
      if (!applyingPreference) saveMuted(SoundEffects.muted);
    });

    function sync() {
      if (SoundEffects.muted !== readMuted()) {
        applyingPreference = true;
        gameToggle.click();
        applyingPreference = false;
      }
      gameToggle.setAttribute('aria-pressed', String(SoundEffects.muted));
    }

    sync();
    syncOnReturn(sync);
  });
})();
