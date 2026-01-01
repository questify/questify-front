# Guide de Déploiement Questify Frontend Web

## Prérequis
- Compte GitHub
- Compte Vercel (gratuit)
- Backend déjà déployé sur Render

## Étape 1 : Préparation du Repository

1. Commitez tous vos changements :
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

## Étape 2 : Déploiement sur Vercel

### 2.1 Connexion à Vercel

1. Allez sur [Vercel.com](https://vercel.com)
2. Cliquez sur "Sign Up" ou "Log In"
3. Connectez-vous avec votre compte GitHub

### 2.2 Import du projet

1. Cliquez sur "Add New..." → "Project"
2. Sélectionnez votre repository `questify-front`
3. Cliquez sur "Import"

### 2.3 Configuration du projet

**Framework Preset** : Vite

**Root Directory** : `apps/web`

**Build Settings** :
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

**Environment Variables** (cliquez sur "Add" pour chaque variable) :
```
VITE_API_URL=https://questify-api.onrender.com
```

Remplacez `https://questify-api.onrender.com` par l'URL réelle de votre backend Render.

### 2.4 Déployer

1. Cliquez sur "Deploy"
2. Attendez que le déploiement se termine (~2-3 minutes)
3. Notez l'URL de production (ex: `https://questify.vercel.app`)

## Étape 3 : Mise à jour du Backend

Il faut maintenant mettre à jour le CORS du backend pour autoriser votre frontend :

1. Allez sur Render.com
2. Ouvrez votre service `questify-api`
3. Allez dans "Environment"
4. Modifiez la variable `CORS_ORIGIN` :
   ```
   CORS_ORIGIN=https://questify.vercel.app
   ```
   (remplacez par votre URL Vercel réelle, **sans** slash à la fin)
5. Le service redémarrera automatiquement

## Étape 4 : Vérification

1. Ouvrez votre URL Vercel dans un navigateur
2. Testez la connexion et l'inscription
3. Vérifiez que les requêtes API fonctionnent

## Déploiements automatiques

Vercel redéploie automatiquement à chaque push sur la branche `main`.

### Preview Deployments

Chaque Pull Request génère automatiquement un environnement de preview avec une URL unique.

## Domaine personnalisé (optionnel)

1. Dans votre projet Vercel, allez dans "Settings" → "Domains"
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS
4. N'oubliez pas de mettre à jour `CORS_ORIGIN` sur Render après

## Variables d'environnement par environnement

Vous pouvez définir différentes variables pour :
- Production
- Preview
- Development

Dans "Settings" → "Environment Variables", cochez les environnements appropriés.

## Troubleshooting

### L'application ne se charge pas
- Vérifiez les logs dans le dashboard Vercel
- Vérifiez que `VITE_API_URL` est correctement définie

### Erreur CORS ou erreurs API
- Vérifiez que le backend est accessible : `https://votre-api.onrender.com/api/health`
- Vérifiez que `CORS_ORIGIN` sur Render correspond exactement à votre URL Vercel
- Vérifiez dans la console du navigateur les erreurs réseau

### Les variables d'environnement ne sont pas prises en compte
- Les variables Vite doivent commencer par `VITE_`
- Après modification, il faut redéployer (Vercel ne redémarre pas automatiquement)
- Allez dans "Deployments" → cliquez sur les 3 points → "Redeploy"

### Build fail
- Vérifiez les logs de build dans Vercel
- Vérifiez que les dépendances sont correctement listées dans `package.json`
- Vérifiez que le chemin `apps/web` est correct dans la configuration

## Performance

Vercel optimise automatiquement :
- Compression (gzip/brotli)
- Cache des assets
- CDN global
- Minification
- Code splitting

## Limites du plan gratuit Vercel

- 100 GB bande passante / mois
- Builds illimités
- Environnements de preview illimités
- SSL automatique
- Pas de limite de requêtes

## Monitoring

Dashboard Vercel :
- Analytics : Nombre de visiteurs, temps de chargement
- Speed Insights : Performance des pages
- Logs : Logs de build et d'exécution
