# Agroliva File Viewer Pro 🚀

Bienvenue dans le code source de **Agroliva File Viewer Pro**, une application web complète permettant de partager des fichiers (PDF, Word, Images) de manière sécurisée via des QR Codes dynamiques.

## ⚠️ Important : Hébergement & GitHub

Cette application est **Full-Stack** (elle possède un frontend React ET un backend Node.js/Express avec une base de données SQLite).

**Vous NE POUVEZ PAS l'héberger sur GitHub Pages.**
GitHub Pages est conçu uniquement pour les sites statiques (HTML/CSS/JS simples). Votre application a besoin d'un serveur pour :
1. Recevoir et stocker les fichiers uploadés (dossier `uploads/`).
2. Gérer la base de données des liens (`files.db`).
3. Convertir les documents Word avec l'API Gemini.

### La solution gratuite (Render.com ou Railway.app)

Pour héberger cette application gratuitement sur internet, vous devez utiliser un service qui supporte **Node.js**. Voici la marche à suivre :

1. **Uploadez ce code sur votre compte GitHub** (créez un nouveau repository privé ou public).
2. Créez un compte gratuit sur [Render.com](https://render.com) ou [Railway.app](https://railway.app).
3. Connectez votre compte GitHub à Render/Railway.
4. Créez un nouveau **"Web Service"** et sélectionnez votre repository Agroliva.
5. Configurez les variables d'environnement suivantes dans le dashboard de Render/Railway :
   - `GEMINI_API_KEY` : Votre clé API Google Gemini.
   - `APP_URL` : L'URL publique que Render/Railway vous donnera (ex: `https://agroliva-viewer.onrender.com`).

*Note pour Render : Comme Render redémarre ses serveurs gratuits régulièrement, les fichiers uploadés localement (`uploads/`) et la base de données SQLite seront effacés à chaque redémarrage. Pour une utilisation en production, il faudra configurer un "Persistent Disk" (Disque persistant) sur Render.*

---

## 💻 Installation en local (Sur votre ordinateur)

Si vous souhaitez tester ou modifier l'application sur votre propre ordinateur :

### Prérequis
- [Node.js](https://nodejs.org/) installé (version 18 ou supérieure).
- Une clé API Google Gemini.

### Étapes

1. **Cloner ou télécharger le code** depuis GitHub.
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Configurer les variables d'environnement** :
   - Copiez le fichier `.env.example` et renommez-le en `.env`.
   - Ouvrez le fichier `.env` et ajoutez votre clé API Gemini :
     ```env
     GEMINI_API_KEY="votre_cle_api_ici"
     APP_URL="http://localhost:3000"
     ```
4. **Lancer l'application** :
   ```bash
   npm run dev
   ```
5. Ouvrez votre navigateur sur `http://localhost:3000`.

---

## 🛠️ Technologies utilisées

- **Frontend** : React 19, Vite, Tailwind CSS 4, Framer Motion, React-PDF.
- **Backend** : Node.js, Express, Multer (pour l'upload).
- **Base de données** : SQLite (via `better-sqlite3`).
- **Intelligence Artificielle** : API Google Gemini (pour la conversion Word vers HTML).
- **Génération QR Code** : Librairie `qrcode`.

## 🎨 Charte Graphique Agroliva

- **Vert foncé (Principal)** : `#009A44`
- **Vert clair (Accent)** : `#8DC63F`
- **Typographie** : Inter (Interface) & Playfair Display (Titres premium).
