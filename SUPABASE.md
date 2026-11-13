# Activer les comptes ONI Habits (Supabase + Google)

Compte environ 20 minutes. Tout est gratuit. Utilise ton compte perso partout (pas celui du boulot).

## 1. Créer la base (Supabase)

1. Va sur https://supabase.com et clique sur **Start your project**. Inscris-toi avec ton GitHub perso ou ton e-mail.
2. **New project** :
   - Name : `oni-habits`
   - Database password : clique sur *Generate* et garde-le quelque part (il ne servira presque jamais).
   - Region : **West EU (Paris)** ou **Central EU (Frankfurt)**
   - Plan : Free
3. Attends 1 ou 2 minutes que le projet soit prêt.
4. Menu de gauche, **SQL Editor** → **New query**. Colle tout le contenu de `supabase/schema.sql` et clique sur **Run**. Le résultat doit être « Success. No rows returned ».

## 2. Récupérer les deux clés à me donner

**Project Settings** (roue crantée) → **Data API** et **API Keys** :
- **Project URL** : `https://xxxxxxxx.supabase.co`
- **anon public** (ou *publishable key*) : une longue clé

Ces deux valeurs sont publiques, tu peux me les envoyer. **Ne m'envoie jamais la `service_role` / *secret key*.**

## 3. Les adresses autorisées

**Authentication** → **URL Configuration** :
- **Site URL** : `https://oni-habits.vercel.app`
- **Redirect URLs**, ajoute :
  - `https://oni-habits.vercel.app/**`
  - `http://localhost:5173/**`

## 4. Couper la connexion par e-mail

L'app ne propose que Google. **Authentication** → **Sign In / Providers** → **Email** → désactive-le → **Save**.
Personne ne pourra alors créer de compte autrement que par Google.

## 5. La connexion Google

1. Va sur https://console.cloud.google.com avec ton compte Google perso. Crée un projet `ONI Habits` (sélecteur de projet en haut).
2. Menu → **APIs & Services** → **OAuth consent screen** (ou *Google Auth Platform*) → **Get started** :
   - App name : `ONI Habits`, support email : ton e-mail
   - Audience : **External**
   - Contact : ton e-mail → **Create**
3. **Audience** → **Publish app** → confirmer. Sans ça, seuls les comptes ajoutés comme « testeurs » peuvent se connecter. Pas de vérification Google nécessaire : l'app ne demande que le nom et l'e-mail.
4. **Clients** → **Create client** :
   - Application type : **Web application**, Name : `ONI Habits`
   - **Authorized JavaScript origins** : `https://oni-habits.vercel.app`
   - **Authorized redirect URIs** : l'adresse « Callback URL » affichée dans Supabase à l'étape suivante, du type `https://xxxxxxxx.supabase.co/auth/v1/callback`
   - **Create**. Google affiche un **Client ID** et un **Client secret**.
5. Dans Supabase : **Authentication** → **Sign In / Providers** → **Google** → active-le, colle le **Client ID** et le **Client secret** → **Save**.

Le Client secret reste entre Google et Supabase : pas besoin de me l'envoyer.

## 6. C'est fini

Envoie-moi le **Project URL** et la clé **anon public** : je les mets dans `app/js/config.js`, je teste et je mets en ligne.
