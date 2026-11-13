# ONI Habits

L'app de routine des athlètes ONI Coaching, installable sur iPhone et Android (PWA).

- **Jour** : souplesse du matin, pas (+1 000 en un geste), calories, eau, sommeil par tranches, séance ou repos, forme, plus les habitudes perso.
- **Mes habitudes** : chaque routine de base s'active ou se désactive ; une routine désactivée disparaît et ne compte plus dans l'XP.
- **Semaine** : nombre de séances et cases, pesée, retours vidéo (case), bilan de la semaine avec le coach (case), retour rehab (case optionnelle).
- **Mois** : payer le coach (rappel sans XP).
- **Social** : « Prochainement ».
- **Profil** : rang, séries, calendrier, courbe de pesée, objectifs, export / import des données.

Pas de serveur ni de base de données : tout est enregistré dans le téléphone (`localStorage`).

## Tester en local

```bash
node serve.mjs
```

Puis ouvrir http://localhost:5173. En local le service worker est désactivé pour toujours voir la dernière version ; ajouter `?sw` à l'adresse pour le tester.

## Mettre en ligne (5 minutes)

Il faut une adresse en **https** pour pouvoir installer l'app. Le plus rapide :

1. Aller sur https://app.netlify.com/drop (compte gratuit).
2. Glisser-déposer **ce dossier `app`** dans la page.
3. Netlify donne une adresse du type `https://oni-habits.netlify.app` (renommable dans les réglages du site).

Autres options qui marchent pareil : Cloudflare Pages, Vercel, GitHub Pages, ou un sous-dossier du site oni-coaching.fr (`/app`).

### Mettre à jour

1. Modifier les fichiers.
2. Changer `VERSION` en haut de `sw.js` (par ex. `oni-habits-v2`), sinon les téléphones gardent l'ancienne version en cache.
3. Re-déposer le dossier sur Netlify (onglet *Deploys* du site, glisser-déposer).

## Installer sur le téléphone

- **iPhone** : ouvrir l'adresse dans **Safari** → bouton **Partager** → **Sur l'écran d'accueil**.
- **Android** : ouvrir l'adresse dans **Chrome** → menu ⋮ → **Installer l'application** (ou le bouton dans Profil).

## Les données

- Elles restent sur le téléphone, dans l'app installée (sur iPhone, l'app installée et Safari ne partagent pas les données : installer d'abord, saisir ensuite).
- **Profil → Exporter mes données** télécharge un fichier JSON de sauvegarde ; **Importer** le recharge (changement de téléphone).
- Désinstaller l'app efface les données.

## Barème d'XP

| Jour | XP | Semaine | XP |
|---|---|---|---|
| Souplesse du matin | 10 | Toutes les séances prévues | 30 |
| Pas (par tranche de 1 000, jusqu'à l'objectif) | 20 | Pesée | 10 |
| Calories dans la fourchette | 20 | Vidéos envoyées | 20 |
| Eau (objectif atteint) | 10 | Bilan fait avec le coach | 50 |
| Séance ou repos | 40 | Rehab (optionnel) | 0 |
| Sommeil (tranche choisie) | 10 | | |
| Forme (fatigue renseignée) | 10 | | |
| Journée complète | 10 | | |
| **Max** (tout activé) | **130** | **Max** | **110** |

Habitude perso cochée : +5. Payer le coach : 0.
Rangs : Kōhai 0 · Senpai 1 500 · Samouraï 5 000 · Shōgun 12 000 · Oni 25 000.
Série : jours complets d'affilée, un joker par semaine.

## Fichiers

```
index.html            page unique
manifest.webmanifest  nom, icônes, couleurs pour l'installation
sw.js                 cache hors ligne
css/app.css           styles (DA du site ONI)
js/app.js             routes, actions, champs
js/views.js           les écrans
js/xp.js              barème, séries, rangs
js/store.js           données locales, export / import
js/dates.js           dates et semaines
js/ui.js              petits composants
icons/                icônes de l'app
serve.mjs             serveur local de test (non utilisé en ligne)
```

## Pour plus tard

- Base de données et comptes (Supabase) pour garder les données entre téléphones et ouvrir l'onglet Social.
- Pas automatiques (Raccourci iPhone, Health Connect).
- Notifications de rappel.
