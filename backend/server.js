const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importation de la connexion MySQL pour tester au démarrage
const db = require('./config/db');

const app = express();

// 1. Middlewares globaux (TOUJOURS avant les routes)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Route de test rapide
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'OK', message: 'Serveur Express et MySQL connectés !' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

// 3. Routes de l'application
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

// 4. Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur 7ajayatna démarré sur http://localhost:${PORT}`);
});