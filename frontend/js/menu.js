// [Imad] Menu principal (index.html)
const MENU_API_URL = 'http://localhost:3000/api';

// Contrat d'équipe : le module Auth (Saad) enregistre le token sous la clé 'token'
const token = localStorage.getItem('token');

function showLoggedIn(loggedIn) {
    document.getElementById('menu-profile').hidden = !loggedIn;
    document.getElementById('menu-logout').hidden = !loggedIn;
    document.getElementById('menu-login').hidden = loggedIn;
    document.getElementById('menu-register').hidden = loggedIn;
    // Pas connecté : le bouton "Jouer" mène à la connexion
    document.getElementById('menu-play').href = loggedIn ? 'game.html' : 'login.html';
}

async function loadWelcome() {
    try {
        const response = await fetch(`${MENU_API_URL}/leaderboard/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const me = await response.json();
        document.getElementById('menu-welcome').textContent = `Mar7ba ${me.username} ! (#${me.rank}, ${me.total_points} pts)`;
    } catch (error) {
        console.error('Menu :', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showLoggedIn(Boolean(token));

    document.getElementById('menu-logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });

    if (token) {
        document.getElementById('menu-welcome').textContent = 'Mar7ba !';
        loadWelcome();
    }
});
