// backend/server.js
const cors = require("cors");
const mongoose = require("mongoose");
const analyticsRoutes = require("./routes/analytics");
const express = require("express");

const app = express();
app.use(cors());

// Connect Mongo FIRST
mongoose.connect("mongodb+srv://zerotrustuser:zerotrust123@zero-trust-cluster.od29tan.mongodb.net/zeroTrustDB?retryWrites=true&w=majority")
  .then(() => console.log("Backend MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Register routes BEFORE listen
app.use("/api/analytics", analyticsRoutes);

app.get("/data", (req, res) => {
  res.json({ message: "Secure backend data accessed ✅" });
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
