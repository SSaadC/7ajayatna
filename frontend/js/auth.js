const API_URL = 'http://localhost:3000/api/auth';

// Fonction utilitaire pour afficher un message d'erreur ou de succès
function showMessage(text, type) {
    const box = document.getElementById('message-box');
    box.textContent = text;
    box.className = `message-box ${type}`;
}

// ==========================================
// 1. GESTION DU FORMULAIRE D'INSCRIPTION
// ==========================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement brutal de la page par le navigateur

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.message || 'Erreur lors de l\'inscription.', 'error');
                return;
            }

            showMessage('Compte créé ! Redirection vers la connexion...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

        } catch (error) {
            showMessage('Impossible de contacter le serveur.', 'error');
        }
    });
}

// ==========================================
// 2. GESTION DU FORMULAIRE DE CONNEXION
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.message || 'Identifiants invalides.', 'error');
                return;
            }

            // Sauvegarde du token JWT et des infos du joueur dans le navigateur
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showMessage('Connexion réussie ! Redirection...', 'success');
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1000);

        } catch (error) {
            showMessage('Impossible de contacter le serveur.', 'error');
        }
    });
}