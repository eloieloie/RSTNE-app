const {onRequest} = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// All Bible data endpoints are served by https://rstne.eloi.in/api (PHP on GoDaddy).
// This function handles only Firebase-dependent push notification endpoints.

admin.initializeApp();

const app = express();

app.use(cors({origin: true}));
app.use(express.json());

const db = admin.firestore();

// Register or refresh a device FCM token
app.post("/api/fcm-token", async (req, res) => {
  try {
    const {token, platform} = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({error: "token is required"});
    }
    await db.collection("fcm_tokens").doc(token).set({
      token,
      platform: platform || "unknown",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    res.json({ok: true});
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({error: error.message});
  }
});

// Remove a device FCM token (called on sign-out or notification opt-out)
app.delete("/api/fcm-token/:token", async (req, res) => {
  try {
    await db.collection("fcm_tokens").doc(req.params.token).delete();
    res.json({ok: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Get registered device count (for admin UI)
app.get("/api/fcm-tokens/count", async (req, res) => {
  try {
    const snapshot = await db.collection("fcm_tokens").count().get();
    res.json({count: snapshot.data().count});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Send a push notification
// Body: { title, body, data?, tokens? }
// - If `tokens` (array) is provided → send to those devices only
// - Otherwise → broadcast to all registered devices
app.post("/api/notifications/send", async (req, res) => {
  try {
    const {title, body, data = {}, tokens} = req.body;
    if (!title || !body) {
      return res.status(400).json({error: "title and body are required"});
    }

    let tokenList = tokens;
    if (!tokenList || !tokenList.length) {
      const snapshot = await db.collection("fcm_tokens").get();
      tokenList = snapshot.docs.map((d) => d.data().token);
    }

    if (!tokenList.length) {
      return res.json({sent: 0, failed: 0, message: "No registered devices"});
    }

    // FCM sendEachForMulticast accepts up to 500 tokens per call
    const CHUNK = 500;
    let sent = 0;
    let failed = 0;
    const failedTokens = [];

    for (let i = 0; i < tokenList.length; i += CHUNK) {
      const chunk = tokenList.slice(i, i + CHUNK);
      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: {title, body},
        data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
        ),
        android: {priority: "high"},
        apns: {payload: {aps: {sound: "default"}}},
      });

      sent += response.successCount;
      failed += response.failureCount;

      // Clean up invalid tokens automatically
      response.responses.forEach((r, idx) => {
        if (!r.success && r.error) {
          const code = r.error.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            failedTokens.push(chunk[idx]);
          }
        }
      });
    }

    // Remove stale tokens in the background
    if (failedTokens.length) {
      const batch = db.batch();
      failedTokens.forEach((t) => batch.delete(db.collection("fcm_tokens").doc(t)));
      batch.commit().catch((e) => console.error("Error pruning stale tokens:", e));
    }

    res.json({sent, failed, total: tokenList.length});
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({error: error.message});
  }
});

// Export the Express app as a Cloud Function
exports.api = onRequest(app);
