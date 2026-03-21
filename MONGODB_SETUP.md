# MongoDB Setup & Testing Guide for Campus Connect

This guide will walk you through setting up MongoDB and verifying your migration from Firestore.

## 1. Choose Your MongoDB Environment

### Option A: MongoDB Atlas (Recommended - Cloud)
1.  **Sign Up:** Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2.  **Create a Cluster:** Build a "Shared" (FREE) cluster.
3.  **Database Access:** Create a database user with a username and password.
4.  **Network Access:** Add `0.0.0.0/0` to the IP Access List (Allows access from anywhere for development).
5.  **Connection String:** Click "Connect" -> "Drivers" -> "Node.js". Copy the connection string.

### Option B: Local MongoDB (Offline)
1.  **Download:** Get the Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community).
2.  **Install:** Follow the installation wizard. Ensure "Install MongoDB as a Service" is checked.
3.  **Compass:** Install **MongoDB Compass** (Graphical UI) to easily see your data.
4.  **URI:** Your local URI will be: `mongodb://localhost:27017/campus-connect`.

---

## 2. Configuration (`.env` file)

In the root directory of the project, create a file named `.env` and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=yoursecretkey123
NODE_ENV=development
```
*Note: Replace `your_mongodb_connection_string_here` with your actual URI from step 1.*

---

## 3. Installation & Startup

1.  **Install All Dependencies:**
    ```bash
    npm run install-all
    ```
2.  **Run Application:**
    ```bash
    npm run fullstack
    ```

---

## 4. Verification (Testing the Setup)

Once the server is running, you can verify the setup using these steps:

### A. Health Check
Open your browser and go to: `http://localhost:5000/api/health`.
- **Success:** You should see `{"status": "ok", "database": "connected"}`.
- **Failure:** If it says "disconnected", check your `MONGO_URI` and network access.

### B. Functional Testing
1.  **Sign Up:** Go to the application and create a new account. This will now save to MongoDB.
2.  **Create a Group:** Navigate to the "Groups" page and create a community.
3.  **Create a Post:** Post an update or an event on the home feed.
4.  **Verify Data:** Open **MongoDB Compass** or **Atlas Collections** to see your new data appearing in the `users`, `groups`, and `posts` collections.

---

## 5. Troubleshooting

- **Error: "Authentication Failed":** Check your username and password in the `MONGO_URI`. Special characters (like `@`) in passwords must be URL-encoded.
- **Error: "ECONNREFUSED":** Ensure MongoDB is actually running (for local setup) or that your IP is whitelisted (for Atlas).
- **Frontend not loading:** Ensure you ran `npm install` inside the `frontend` folder and that the backend is running on port 5000.
