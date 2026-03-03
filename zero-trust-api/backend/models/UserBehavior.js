const mongoose = require("mongoose");

const userBehaviorSchema = new mongoose.Schema({
  userId: String,
  lastIp: String,
  recentRequests: [Number], // timestamps
  failedAttempts: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("UserBehavior", userBehaviorSchema);