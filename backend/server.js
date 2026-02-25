// server.js

const express = require("express");
const HybridScheduler = require("./scheduling");
const AIRecommendationEngine = require("./recommendation");

const app = express();
app.use(express.json());

// In-memory recommendation engine (for demo)
let recommendationEngine = null;

/* =========================
   HYBRID SCHEDULER ROUTE
========================= */
app.post("/schedule", (req, res) => {
  const { processes, initialQuantum } = req.body;

  if (!processes || !Array.isArray(processes)) {
    return res.status(400).json({ error: "Invalid processes array" });
  }

  const scheduler = new HybridScheduler(processes, {
    initialQuantum: initialQuantum || 2
  });

  const result = scheduler.run();

  res.json({
    message: "Hybrid Scheduling Complete",
    result
  });
});

/* =========================
   INITIALIZE RECOMMENDER
========================= */
app.post("/recommend/init", (req, res) => {
  const { items, epsilon } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid items array" });
  }

  recommendationEngine = new AIRecommendationEngine(items, { epsilon });

  res.json({ message: "Recommendation engine initialized" });
});

/* =========================
   GET RECOMMENDATION
========================= */
app.get("/recommend", (req, res) => {
  if (!recommendationEngine) {
    return res.status(400).json({ error: "Engine not initialized" });
  }

  const recommendation = recommendationEngine.recommend();

  res.json({
    recommendation
  });
});

/* =========================
   SEND FEEDBACK (REWARD)
========================= */
app.post("/recommend/feedback", (req, res) => {
  const { itemId, reward } = req.body;

  if (!recommendationEngine) {
    return res.status(400).json({ error: "Engine not initialized" });
  }

  recommendationEngine.update(itemId, reward);

  res.json({
    message: "Feedback recorded",
    stats: recommendationEngine.getStats()
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});