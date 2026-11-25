// [Imad] Récupération et affichage du classement (leaderboard.html)
const LB_API_URL = 'http://localhost:3000/api';

// Contrat d'équipe : le module Auth (Saad) enregistre le token sous la clé 'token'
const lbToken = localStorage.getItem('token');

function showStatus(message) {
    const body = document.getElementById('lb-body');
    body.innerHTML = '';
    const cell = body.insertRow().insertCell();
    cell.colSpan = 4;
    cell.className = 'lb-status';
    cell.textContent = message;
}

function initial(player) {
    return (player.username || '?').charAt(0).toUpperCase();
}

function createAvatar(player) {
    const avatar = document.createElement('span');
    avatar.className = 'lb-avatar';
    const url = player.avatar_url;
    if (url && url !== 'default.png') {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.onerror = () => { img.remove(); avatar.textContent = initial(player); };
        avatar.appendChild(img);
    } else {
        avatar.textContent = initial(player);
    }
    return avatar;
}

function renderLeaderboard(players, myId) {
    if (players.length === 0) {
        showStatus('Aucun joueur pour le moment. Sois le premier !');
        return;
    }

    const body = document.getElementById('lb-body');
    body.innerHTML = '';

    players.forEach((player) => {
        const row = body.insertRow();
        if (player.rank <= 3) row.classList.add(`lb-podium-${player.rank}`);
        if (player.id === myId) row.classList.add('lb-is-me');

        row.insertCell().textContent = player.rank;

        const nameCell = row.insertCell();
        nameCell.className = 'lb-player';
        nameCell.appendChild(createAvatar(player));
        const name = document.createElement('span');
        name.textContent = player.username; // textContent : pas d'injection HTML possible
        nameCell.appendChild(name);

        row.insertCell().textContent = player.total_points;
        row.insertCell().textContent = player.games_played;
    });
}

// Rang du joueur connecté (null si pas connecté ou token invalide)
async function loadMe() {
    if (!lbToken) return null;
    try {
        const response = await fetch(`${LB_API_URL}/leaderboard/me`, {
            headers: { Authorization: `Bearer ${lbToken}` }
        });
        if (!response.ok) return null;
        const me = await response.json();
        const el = document.getElementById('lb-my-rank');
        el.textContent = `Ta position : #${me.rank} sur ${me.total_players} joueurs (${me.total_points} pts)`;
        el.hidden = false;
        return me;
    } catch (error) {
        console.error('Rang joueur :', error);
        return null;
    }
}

async function loadLeaderboard(limit, myId) {
    showStatus('Chargement...');
    try {
        const response = await fetch(`${LB_API_URL}/leaderboard?limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        renderLeaderboard(await response.json(), myId);
    } catch (error) {
        console.error('Classement :', error);
        showStatus('Impossible de charger le classement. Le serveur est-il lancé ?');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const select = document.getElementById('lb-limit');
    const me = await loadMe();
    const myId = me ? me.id : null;

    select.addEventListener('change', () => loadLeaderboard(select.value, myId));
    loadLeaderboard(select.value, myId);
});
