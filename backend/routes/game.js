const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// =========================================================
// ROUTE DE FIN DE PARTIE : POST /api/game/finish (Protégée)
// =========================================================
router.post('/finish', authMiddleware, async (req, res) => {
    try {
        // 1. Récupérer l'ID du joueur authentifié depuis le token JWT
        const userId = req.user.id;

        // 2. Récupérer les données envoyées par game.js
        const { score_earned, riddles_answered } = req.body;

        if (score_earned === undefined || riddles_answered === undefined) {
            return res.status(400).json({ message: 'Données de session incomplètes.' });
        }

        // 3. Enregistrer la session de jeu dans `game_sessions`
        await db.query(
            'INSERT INTO game_sessions (user_id, score_earned, riddles_answered) VALUES (?, ?, ?)',
            [userId, score_earned, riddles_answered]
        );

        // 4. Mettre à jour le score cumulé et le compteur de parties dans `users`
        await db.query(
            'UPDATE users SET total_points = total_points + ?, games_played = games_played + 1 WHERE id = ?',
            [score_earned, userId]
        );

        // 5. Récupérer le nouveau score total à jour pour le renvoyer au frontend
        const [updatedUsers] = await db.query(
            'SELECT total_points, games_played FROM users WHERE id = ?',
            [userId]
        );

        res.status(201).json({
            message: 'Score enregistré en base de données !',
            total_points: updatedUsers[0].total_points,
            games_played: updatedUsers[0].games_played
        });

    } catch (error) {
        console.error('Erreur sauvegarde score:', error);
        res.status(500).json({ message: 'Erreur lors de la sauvegarde du score.' });
    }
});

module.exports = router;