const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ==========================================
// 1. ROUTE D'INSCRIPTION : POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
    try {
        // 1. Récupérer les données envoyées par le frontend
        const { username, email, password } = req.body;

        // 2. Vérifier que tous les champs sont remplis
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
        }

        // 3. Vérifier si l'email ou le username existe déjà dans MySQL
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Cet email ou ce nom d\'utilisateur est déjà utilisé.' });
        }

        // 4. Hacher le mot de passe (10 tours de "sel" cryptographique)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 5. Insérer le nouvel utilisateur dans la table `users`
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        // 6. Répondre avec le statut 201 (Created)
        res.status(201).json({
            message: 'Inscription réussie !',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// ==========================================
// 2. ROUTE DE CONNEXION : POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
    try {
        // 1. Récupérer les identifiants envoyés
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis.' });
        }

        // 2. Chercher l'utilisateur par email dans MySQL
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        // Si aucun utilisateur trouvé (on reste vague par sécurité)
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const user = users[0];

        // 3. Comparer le mot de passe en clair avec le hash stocké en base
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // 4. Générer le badge JWT (valable 24h)
        const token = jwt.sign(
            { id: user.id, username: user.username }, // Payload (données encodées dans le badge)
            process.env.JWT_SECRET,                   // Signature secrète depuis .env
            { expiresIn: '24h' }
        );

        // 5. Renvoyer le token + les infos publiques du joueur (JAMAIS le password_hash !)
        res.json({
            message: 'Connexion réussie !',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                total_points: user.total_points,
                games_played: user.games_played
            }
        });

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

module.exports = router;