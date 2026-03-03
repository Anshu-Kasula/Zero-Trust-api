const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://zerotrustuser:zerotrust123@zero-trust-cluster.od29tan.mongodb.net/zeroTrustDB?retryWrites=true&w=majority";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
