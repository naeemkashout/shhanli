const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let initialized = false;

function init() {
  if (initialized) return;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "";
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "";

  let serviceAccount = null;

  if (base64) {
    try {
      const json = Buffer.from(base64, "base64").toString("utf8");
      serviceAccount = JSON.parse(json);
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:", err.message);
    }
  } else if (serviceAccountPath) {
    try {
      const resolved = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);
      serviceAccount = require(resolved);
    } catch (err) {
      console.error("Failed to load service account from path:", err.message);
    }
  }

  if (!serviceAccount) {
    console.warn("FCM not initialized: no service account provided");
    return;
  }

  try {
    const credential =
      admin && admin.credential && typeof admin.credential.cert === "function"
        ? admin.credential.cert(serviceAccount)
        : typeof admin.cert === "function"
        ? admin.cert(serviceAccount)
        : null;

    if (!credential) {
      throw new Error("Firebase Admin credential API not found");
    }

    admin.initializeApp({
      credential,
    });
    initialized = true;
    console.log("✅ Firebase Admin initialized for FCM");
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err.message);
  }
}

async function sendToTokens(tokens = [], { title, body, data } = {}) {
  init();
  if (!initialized) return;
  if (!Array.isArray(tokens) || tokens.length === 0) return;

  const message = {
    tokens,
    notification: title || body ? { title: title || "", body: body || "" } : undefined,
    data: data || undefined,
  };

  try {
    const res = await admin.messaging().sendMulticast(message);
    return res;
  } catch (err) {
    console.error("FCM sendMulticast error:", err.message);
    return null;
  }
}

async function sendToTopic(topic, { title, body, data } = {}) {
  init();
  if (!initialized) return;
  if (!topic) return;

  const message = {
    topic,
    notification: title || body ? { title: title || "", body: body || "" } : undefined,
    data: data || undefined,
  };

  try {
    const res = await admin.messaging().send(message);
    return res;
  } catch (err) {
    console.error("FCM send to topic error:", err.message);
    return null;
  }
}

module.exports = {
  init,
  sendToTokens,
  sendToTopic,
};
