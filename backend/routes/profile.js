const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const token = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '')?.[1];
    if (!token) {
        return res.status(401).json({ message: 'Connectez-vous pour consulter votre profil.' });
    }

    try {
        // Same signed user ID as the team's login token.
        const { id } = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(403).json({ message: 'Session invalide ou expirée.' });
        }
        res.locals.profileUserId = id;
    } catch {
        return res.status(403).json({ message: 'Session invalide ou expirée.' });
    }

    next();
});

router.get('/', async (req, res) => {
    try {
        const userId = res.locals.profileUserId;
        const [[profile]] = await db.execute(
            'SELECT username, email, total_points, games_played, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (!profile) {
            return res.status(404).json({ message: 'Profil introuvable.' });
        }

        const [sessions] = await db.execute(
            `SELECT score_earned, riddles_answered, played_at
             FROM game_sessions WHERE user_id = ? ORDER BY played_at DESC, id DESC LIMIT 5`,
            [userId]
        );
        return res.json({ profile, sessions });
    } catch (error) {
        console.error('Lecture du profil impossible', error.code || error.name);
        return res.status(500).json({ message: 'Le profil est indisponible. Réessayez.' });
    }
});

router.patch('/', express.json({ limit: '2kb' }), async (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    if (!username || username.length > 50) {
        return res.status(400).json({ message: 'Le pseudonyme doit contenir entre 1 et 50 caractères.' });
    }

    try {
        const [result] = await db.execute('UPDATE users SET username = ? WHERE id = ?', [username, res.locals.profileUserId]);
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Profil introuvable.' });
        }
        return res.json({ username });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ce pseudonyme est déjà utilisé.' });
        }
        console.error('Modification du profil impossible', error.code || error.name);
        return res.status(500).json({ message: 'Enregistrement impossible. Réessayez.' });
    }
});

router.use((req, res) => res.status(404).json({ message: 'Route de profil introuvable.' }));
router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    const message = status === 500 ? 'Enregistrement impossible. Réessayez.' : 'Requête de profil invalide.';
    return res.status(status).json({ message });
});

module.exports = router;
