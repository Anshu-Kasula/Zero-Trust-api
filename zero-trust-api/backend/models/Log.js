const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userId: String,
  ip: String,
  endpoint: String,
  decision: String,
  riskScore: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Log", logSchema);