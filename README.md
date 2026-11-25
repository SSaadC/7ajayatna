# 7AJAYATNA (حجاياتنا) – Module Jeu de Devinettes (Version 0.1)
**Projet Personnel et Professionnel (PPP) – INPT Rabat · Cycle Ingénieur Cloud & IoT**

Ce projet implémente l'interface complète du **module de jeu (01 — Jeu 7ajayatna)** conformément au cahier des charges officiel.

---

## 🌟 Fonctionnalités Implémentées (Conformité Cahier des Charges)

| Réf. Cahier | Fonctionnalité | Statut | Détails |
|---|---|---|---|
| **FR-1** | Interface responsive (PC, Tablette, Mobile) | ✅ Fait | CSS Grid & Flexbox, boutons tactiles, vue adaptée. |
| **FR-2** | Pseudo du joueur & score persistant | ✅ Fait | Enregistrement dans `localStorage` (prêt pour Supabase Auth). |
| **FR-3** | 3 Niveaux de difficulté avec progression | ✅ Fait | Niveau 1 (Sahla), Niveau 2 (Mtwassat), Niveau 3 (S3iba). Déblocage automatique selon le score. |
| **FR-4** | Saisie libre (Arabe ou Latin / Arabizi) | ✅ Fait | Supporte les chiffres translittérés (3, 7, 9, 5), arabe et français avec touches rapides Arabizi. |
| **FR-5** | Indices culturels optionnels | ✅ Fait | Bouton « Demander un indice » (-2 pts sur la question). |
| **FR-6** | Évaluation hybride (Règles, variantes, Levenshtein) | ✅ Fait | Moteur `DarijaEvaluator` : normalisation phonétique, détection de préfixes (`l-`, `el-`, `ال`), tolérance aux coquilles (Levenshtein) et hook IA. |
| **FR-7** | Verdict, points & explication culturelle | ✅ Fait | Affichage détaillé du contexte culturel et de la région d'origine (Fès, Marrakech, Atlas, etc.) à chaque réponse. |
| **FR-8** | Historique de session & progression | ✅ Fait | Modal consultable récapitulant les devinettes réussies et manquées. |

---

## 📁 Structure des Fichiers

```
devinettes-game/
├── index.html        # Structure sémantique, écrans de jeu, modales & canevas
├── style.css         # Thème Néo-Marocain moderne (Zellige, Terracotta, Émeraude, Or)
├── data.js           # Corpus authentique de 7ajayat vérifiées avec métadonnées culturelles
├── game.js           # Moteur du jeu, audio Web Audio API, normalisation Darija & confettis
└── README.md         # Documentation technique et guide d'intégration
```

---

## 🔌 Comment vos coéquipiers peuvent s'intégrer :

1. **Membre 3 (Authentification & Base de données - Supabase / PostgreSQL) :**
   - Remplacer le `localStorage` de `App.loadState()` et `App.saveState()` par les appels API Supabase :
   ```javascript
   // Exemple dans game.js :
   const { data, error } = await supabase.from('user_progress').upsert({
     user_id: user.id,
     score: App.state.totalScore,
     unlocked_levels: App.state.unlockedLevels
   });
   ```

2. **Membre 4 (Évaluation IA Gemini & Edge Function) :**
   - Dans `DarijaEvaluator.evaluate()` (fichier `game.js`), lorsque le verdict local est ambigu (`aiFallbackReady: true`), appeler l'Edge function :
   ```javascript
   const res = await fetch('/api/evaluate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ questionId: q.id, answer: userInput })
   });
   const data = await res.json(); // { verdict: 'correct' | 'incorrect', confidence: 0.86, ... }
   ```

---

## 🚀 Comment lancer la page :
Ouvrez simplement le fichier `index.html` dans n'importe quel navigateur (Google Chrome, Firefox, Edge, Safari). Aucun serveur lourd n'est requis pour la version 0 !
