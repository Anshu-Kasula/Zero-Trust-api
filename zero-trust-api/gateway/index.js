const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");

const connectDB = require("./db");
const { JWT_SECRET, TOKEN_EXPIRY_SECONDS } = require("./config");
const { calculateRisk } = require("./riskEngine");
const Alert = require("./models/Alert");

// --------------------
// MongoDB Log Schema
// --------------------
const logSchema = new mongoose.Schema({
  timestamp: String,
  userId: String,
  ip: String,
  endpoint: String,
  risk_score: Number,
  reasons: [String],
  decision: String,
});

const Log = mongoose.model("Log", logSchema);

// --------------------
// App Setup
// --------------------
const app = express();
app.use(express.json());
app.use(cors());

connectDB();

// --------------------
// Helper: Log Event
// --------------------
async function logEvent(event) {
  try {
    fs.appendFileSync("logs.jsonl", JSON.stringify(event) + "\n");
  } catch (err) {
    console.error("File log error:", err.message);
  }

  try {
    await Log.create(event);
  } catch (err) {
    console.error("MongoDB log error:", err.message);
  }
}

// --------------------
// LOGIN
// --------------------
app.post("/auth/login", (req, res) => {
  const { userId } = req.body;

  let role = "user";
  if (userId === "admin1") role = "admin";

  const token = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY_SECONDS }
  );

  res.json({ message: "Login successful", token, role });
});

// --------------------
// Admin Middleware
// --------------------
function adminOnly(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --------------------
// ZERO TRUST MIDDLEWARE
// --------------------
async function zeroTrustMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  const ip =
    req.headers["x-test-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const endpoint = req.path;

  const logBase = {
    timestamp: new Date().toISOString(),
    ip,
    endpoint,
  };

  // 🚫 No Token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const event = {
      ...logBase,
      decision: "BLOCK",
      risk_score: 100,
      reasons: ["no_token"],
    };

    await logEvent(event);
    return res.status(401).json(event);
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    const event = {
      ...logBase,
      decision: "BLOCK",
      risk_score: 100,
      reasons: ["invalid_or_expired_token"],
    };

    await logEvent(event);
    return res.status(401).json(event);
  }

  // --------------------
  // Risk Engine
  // --------------------
  const { score, reasons } = await calculateRisk({
    userId: decoded.userId,
    currentIp: ip,
    endpoint,
  });

  let decision = "ALLOW";
  if (score >= 40) decision = "BLOCK";
  else if (score >= 31) decision = "LOG_ONLY";

  const event = {
    ...logBase,
    userId: decoded.userId,
    risk_score: score,
    reasons,
    decision,
  };

  // 🚨 ALERT CONDITION
  if (score >= 50) {
    await Alert.create({
      message: `⚠️ Suspicious activity detected for user ${decoded.userId} from IP ${ip}`,
      severity: "HIGH",
    });
  }

  await logEvent(event);

  if (decision === "BLOCK") {
    return res.status(403).json(event);
  }

  next();
}

// --------------------
// SECURE ROUTE
// --------------------
app.get("/api/secure", zeroTrustMiddleware, async (req, res) => {
  try {
    const response = await axios.get("http://localhost:4000/data");

    res.json({
      gateway: "Allowed ✅",
      backend: response.data,
    });
  } catch {
    res.status(500).json({ error: "Backend error" });
  }
});

// --------------------
// ADMIN LOGS
// --------------------
app.get("/admin/logs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.json({ logs });
  } catch {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// --------------------
// ADMIN STATS
// --------------------
app.get("/admin/stats", async (req, res) => {
  try {
    const total = await Log.countDocuments();
    const allowed = await Log.countDocuments({ decision: "ALLOW" });
    const blocked = await Log.countDocuments({ decision: "BLOCK" });
    const suspicious = await Log.countDocuments({ decision: "LOG_ONLY" });

    res.json({
      total_requests: total,
      allowed_requests: allowed,
      blocked_requests: blocked,
      suspicious_requests: suspicious,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// --------------------
// ADMIN ALERTS
// --------------------
app.get("/admin/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ alerts });
  } catch (err) {
    console.error("Alert fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// --------------------
// START SERVER
// --------------------
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
});