const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
    // 1. Lire l'en-tête HTTP Authorization (format attendu : "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si aucun token n'est fourni -> rejet immédiat (401 Unauthorized)
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    try {
        // 3. Vérifier l'authenticité et l'expiration du token avec la clé secrète
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attacher les infos du joueur ({ id, username }) à l'objet req
        req.user = decoded;

        // 5. Passer le relais à la route suivante
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
}

module.exports = authMiddleware;