const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importation de la connexion MySQL pour tester au démarrage
const db = require('./config/db');

const app = express();

// Middlewares globaux
app.use(cors()); // Autorise le frontend (HTML/JS) à appeler ce serveur
app.use(express.json()); // Permet au serveur de lire les données JSON envoyées dans req.body

// Route de test rapide
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'OK', message: 'Serveur Express et MySQL connectés !' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

// Routes de l'application
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', require('./routes/leaderboard')); // [Imad] Classement général

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur 7ajayatna démarré sur http://localhost:${PORT}`);
});