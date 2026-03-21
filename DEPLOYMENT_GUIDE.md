# Campus Connect Deployment & Setup Guide

This guide provides step-by-step instructions for setting up the MongoDB backend and deploying the application to Vercel.

## 1. MongoDB Atlas Setup (Database)

Campus Connect uses MongoDB for data persistence.

1.  **Create an Account**: Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2.  **Create a Cluster**:
    *   Deploy a **FREE (Shared)** cluster.
    *   Choose a provider (AWS/Google Cloud/Azure) and a region close to your users.
3.  **Database Access**:
    *   Go to **Security -> Database Access**.
    *   Add a new database user.
    *   Choose **Password** as the Authentication Method.
    *   Set a username and a strong password (avoid special characters like `@` or `:` if possible, or URL-encode them later).
    *   Set 'Built-in Role' to **Read and write to any database**.
4.  **Network Access**:
    *   Go to **Security -> Network Access**.
    *   Add an IP Address.
    *   Select **Allow Access from Anywhere** (`0.0.0.0/0`) for Vercel deployment.
5.  **Get Connection String**:
    *   Go to **Deployment -> Database**.
    *   Click **Connect** on your cluster.
    *   Select **Drivers** (Node.js).
    *   Copy the connection string (it looks like `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`).
    *   Replace `<username>` and `<password>` with the credentials you created in step 3.

## 2. Vercel Deployment (Hosting)

The project is structured as a monorepo with an Express backend at the root and a Vite frontend in the `/frontend` folder.

1.  **Import Project**:
    *   Log in to [Vercel](https://vercel.com).
    *   Click **Add New... -> Project**.
    *   Import your GitHub repository.
2.  **Configure Project Settings**:
    *   **Framework Preset**: Select **Other** or **Vite** (Vercel should auto-detect).
    *   **Root Directory**: Keep as the repository root (`./`).
    *   **Build & Development Settings**:
        *   Build Command: `npm run install-all && cd frontend && npm run build`
        *   Output Directory: `frontend/dist` (This is handled by `vercel.json`).
3.  **Environment Variables**:
    Add the following variables in the Vercel dashboard:
    *   `MONGO_URI`: Your MongoDB connection string from Section 1.
    *   `JWT_SECRET`: A long, random string for signing JWT tokens.
    *   `NODE_ENV`: `production`
    *   `VITE_FIREBASE_API_KEY`: Your Firebase API Key.
    *   `VITE_FIREBASE_AUTH_DOMAIN`: `campus-connect-a832c.firebaseapp.com`
    *   `VITE_FIREBASE_PROJECT_ID`: `campus-connect-a832c`
    *   `VITE_FIREBASE_STORAGE_BUCKET`: `campus-connect-a832c.firebasestorage.app`
    *   `VITE_FIREBASE_MESSAGING_SENDER_ID`: `475351085570`
    *   `VITE_FIREBASE_APP_ID`: `1:475351085570:web:24e751a9a93e7154cf2d1b`
    *   `VITE_FIREBASE_MEASUREMENT_ID`: `G-SWKF6LS1H7`
4.  **Deploy**: Click **Deploy**. Vercel will build the frontend and host the Express API as a serverless function via the configuration in `vercel.json`.

## 3. Post-Deployment Verification

1.  **Check API Health**: Visit `https://your-deployment-url.vercel.app/api/health`.
    *   It should return `{"status": "ok", "database": "connected"}`.
2.  **Initial Signup**:
    *   Navigate to your app URL.
    *   Go to **Signup**.
    *   Create a **Super Admin** account (Use the secret key `admin` as defined in `SignupPage.tsx`).
    *   This will create the first user in your MongoDB database.

## 4. Troubleshooting

*   **Database Disconnected**: Check `MONGO_URI` in Vercel environment variables and ensure `0.0.0.0/0` is whitelisted in MongoDB Atlas.
*   **404 Not Found (Frontend)**: Ensure `vercel.json` is correctly configured to route all non-API requests to `frontend/index.html`.
*   **Authentication Fails**: Verify `JWT_SECRET` is the same across all serverless function calls.
