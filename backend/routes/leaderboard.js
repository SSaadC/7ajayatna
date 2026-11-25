const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// GET /api/leaderboard?limit=10   (public)
// Classement général : les joueurs triés par total de points.
// En cas d'égalité, celui qui a joué le moins de parties passe devant,
// puis le plus ancien inscrit.
router.get('/', async (req, res) => {
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    try {
        const [rows] = await db.query(
            `SELECT id, username, avatar_url, total_points, games_played
             FROM users
             ORDER BY total_points DESC, games_played ASC, created_at ASC
             LIMIT ?`,
            [limit]
        );

        // Calcul du rang : deux joueurs avec les mêmes points ont le même rang (1, 2, 2, 4...)
        let previousPoints = null;
        let previousRank = 0;
        const leaderboard = rows.map((player, index) => {
            const rank = player.total_points === previousPoints ? previousRank : index + 1;
            previousPoints = player.total_points;
            previousRank = rank;
            return {
                rank,
                id: player.id,
                username: player.username,
                avatar_url: player.avatar_url,
                total_points: player.total_points,
                games_played: player.games_played
            };
        });

        res.json(leaderboard);
    } catch (error) {
        console.error('Erreur leaderboard :', error.message);
        res.status(500).json({ message: 'Impossible de charger le classement.' });
    }
});

// Lit l'identifiant du joueur dans l'en-tête "Authorization: Bearer <token>".
// TODO après le merge : remplacer par le middleware de Saad (middleware/authMiddleware.js).
function getUserIdFromToken(req) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    try {
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        return payload.id ?? payload.userId ?? null; // nom du champ à confirmer avec Saad
    } catch {
        return null;
    }
}

// GET /api/leaderboard/me   (connecté)
// Rang du joueur connecté, même s'il n'est pas dans le top affiché.
router.get('/me', async (req, res) => {
    const userId = getUserIdFromToken(req);
    if (!userId) {
        return res.status(401).json({ message: 'Token manquant ou invalide.' });
    }

    try {
        const [users] = await db.query(
            'SELECT id, username, total_points, games_played FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Joueur introuvable.' });
        }

        const player = users[0];
        const [[{ better }]] = await db.query(
            'SELECT COUNT(*) AS better FROM users WHERE total_points > ?',
            [player.total_points]
        );
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM users');

        res.json({
            rank: better + 1,
            total_players: total,
            id: player.id,
            username: player.username,
            total_points: player.total_points,
            games_played: player.games_played
        });
    } catch (error) {
        console.error('Erreur rang joueur :', error.message);
        res.status(500).json({ message: 'Impossible de calculer le rang.' });
    }
});

module.exports = router;
