const Alert = require("./models/Alert");

const userMemory = {};

async function calculateRisk({ userId, currentIp, endpoint }) {

  if (!userMemory[userId]) {
    userMemory[userId] = {
      lastIp: null,
      requestCount: 0,
      lastRequestTime: Date.now(),
    };
  }

  const user = userMemory[userId];

  let score = 0;
  let reasons = [];

  // IP Change
  if (user.lastIp && user.lastIp !== currentIp) {
    score += 20;
    reasons.push("ip_changed");
  }

  user.lastIp = currentIp;

  // Frequency
  const now = Date.now();

  if (now - user.lastRequestTime < 2000) {
    user.requestCount += 1;
  } else {
    user.requestCount = 1;
  }

  user.lastRequestTime = now;

  if (user.requestCount > 5) {
    score += 30;
    reasons.push("too_many_requests");
  }

  // Admin endpoint
  if (endpoint.includes("admin")) {
    score += 20;
    reasons.push("admin_endpoint_access");
  }

  console.log("Risk score:", score); // 👈 ADD THIS LINE

  // 🚨 TEMPORARY FORCE ALERT
  if (score >= 10) {
    console.log("Creating alert...");

    await Alert.create({
      message: `⚠️ Suspicious activity detected for user ${userId} from IP ${currentIp}`,
      severity: "HIGH",
    });
  }

  return { score, reasons };
}

module.exports = { calculateRisk };