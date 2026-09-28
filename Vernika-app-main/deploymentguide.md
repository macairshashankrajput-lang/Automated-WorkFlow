# Vernika Business Suite - Deployment Guide

This guide explains how to deploy the Vernika Business Suite to a production environment. The application is a client-side SPA (Single Page Application) built with React and Vite, using Firebase for the backend.

## Prerequisites

1.  **Node.js & npm**: Ensure you have Node.js 18+ installed.
2.  **Firebase Project**: You need a Firebase project with Firestore and Authentication (Google Auth) enabled.
3.  **Environment Variables**: The application requires configuration variables to connect to Firebase.

## Environment Configuration

A `.env` file has been created in the root directory for your convenience. **Do not commit this file to version control.** It contains your Firebase connectivity keys.

Before deploying, ensure your production build system has access to these variables. The expected variables are documented in `.env.example`:

- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_GOOGLE_OAUTH_CLIENT_ID`

*Note: In the AI Studio environment, the app uses `firebase-applet-config.json`. If deploying outside AI Studio, ensure your build system passes the `.env` variables or that `firebase-applet-config.json` is bundled.*

## Deployment Methods

### 1. Docker Deployment (Recommended)

A `Dockerfile` and `nginx.conf` have been provided to build and serve the application as a containerized static site.

```bash
# 1. Build the Docker image
docker build -t vernika-suite .

# 2. Run the Docker container
docker run -d -p 8080:80 vernika-suite
```

The application will now be accessible at `http://localhost:8080`. You can deploy this image to any container orchestration platform (e.g., Google Cloud Run, AWS ECS, Kubernetes).

### 2. Vercel / Netlify / Cloudflare Pages

Since this is a Vite-based static site, it can be easily deployed to modern edge-hosting providers.

1.  Connect your GitHub repository to Vercel/Netlify.
2.  Set the **Framework Preset** to Vite.
3.  Set the **Build Command** to `npm run build`.
4.  Set the **Output Directory** to `dist`.
5.  Add the environment variables from your `.env` file into the platform's Environment Variables settings.
6.  Deploy.

### 3. Firebase Hosting

If you want to host the app directly on Firebase:

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase Hosting (if not already initialized)
firebase init hosting

# Answer the prompts:
# - What do you want to use as your public directory? dist
# - Configure as a single-page app (rewrite all urls to /index.html)? Yes
# - Set up automatic builds and deploys with GitHub? No

# 4. Build the application
npm run build

# 5. Deploy to Firebase
firebase deploy --only hosting
```

## Security Note

- **Never commit `.env` to source control.**
- Ensure your `firestore.rules` are deployed to your Firebase project to secure your database.

## Secure profile provisioning

The Employee Directory now provisions Firebase Authentication users through the administrator-only callable function `provisionProfile`. Deploy Firestore rules and Functions from the repository root:

```bash
firebase use gen-lang-client-0833693805
firebase deploy --only firestore:rules,functions --project gen-lang-client-0833693805
```

The caller must have the Firebase Auth custom claim `{ "admin": true }` or an `admins/{uid}` Firestore document. Passwords are sent only to Firebase Auth through the callable function and are not stored in Firestore. Creating another administrator requires the caller to have the `admin` custom claim.

To provision the existing test profiles, download a Firebase service-account key outside the repository and run:

```bash
cd functions
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/firebase-service-account.json
node scripts/provision-existing-profiles.js
```

The migration creates Firebase Auth accounts and UID-keyed Firestore profiles for the eight employee/admin profiles and three client profiles. It uses `password123` only as a development migration password. Change all passwords before production use.

Deploy the browser application after the Functions endpoint is available:

```bash
cd ..
npm install
npm run build
firebase deploy --only hosting --project gen-lang-client-0833693805
```

If the web app is hosted on Vercel, Netlify, Cloudflare Pages, or another provider, deploy the static `dist` output there after deploying Firebase rules and Functions. Never place a Firebase Admin service-account key in the browser bundle or frontend environment variables.
