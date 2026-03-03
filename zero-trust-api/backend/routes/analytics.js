const express = require("express");
const router = express.Router();
const Log = require("../models/Log");

/* -------------------- DECISION STATS -------------------- */
router.get("/decision-stats", async (req, res) => {
  try {
    const stats = await Log.aggregate([
      {
        $group: {
          _id: "$decision",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- REQUEST TREND (Last 24h) -------------------- */
router.get("/requests-trend", async (req, res) => {
  try {
    const data = await Log.aggregate([
      {
        $addFields: {
          timestampDate: { $toDate: "$timestamp" }
        }
      },
      {
        $group: {
          _id: { hour: { $hour: "$timestampDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.hour": 1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- TOP ATTACKING IPS -------------------- */
router.get("/top-ips", async (req, res) => {
  try {
    const data = await Log.aggregate([
      {
        $group: {
          _id: "$ip",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;