const admin = require('firebase-admin');

// Load service account key from environment variable or local file
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        serviceAccount = require("./serviceAccountKey.json");
    }
} catch (error) {
    console.error("Error loading service account key:", error.message);
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

module.exports = { db, admin };
