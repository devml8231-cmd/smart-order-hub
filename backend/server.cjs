// server.js

const express = require("express");
const cors = require("cors");
const HybridScheduler = require("./scheduler.cjs");
const AIRecommendationEngine = require("./airecommendation.cjs");
const { createClient } = require("@supabase/supabase-js");
const Razorpay = require("razorpay");
require("dotenv").config({ path: "../.env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(cors());
app.use(express.json());

// Razorpay instance (uses test credentials from .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YA0NM1vzMXoK7n',
  key_secret: process.env.RAZORPAY_SECRET || 'TYbQmsU1f0kuJU3VQZlUx9sA',
});

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

/* =========================
   DYNAMIC WAIT TIME ROUTE
========================= */
app.post("/calculate-wait-time", async (req, res) => {
  try {
    const {
      currentOrders = [],
      newOrder,
      historicalWaitFactor = 1.0,
      initialQuantum = 5
    } = req.body;

    if (!newOrder) {
      return res.status(400).json({ error: "No new order provided" });
    }

    // Fetch available chefs from database
    const { data: chefs, error: chefError } = await supabase
      .from('chefs')
      .select('id, name')
      .eq('is_available', true);

    if (chefError) {
      console.error('Error fetching chefs:', chefError);
    }

    const chefIds = chefs && chefs.length > 0 ? chefs.map(c => c.id) : ['default_chef'];

    // Combine existing orders with the new one for simulation
    const allProcesses = [...currentOrders, newOrder].map((o, index) => ({
      id: o.id || `order_${index}`,
      burstTime: o.burstTime || 15,
      chef_id: o.chef_id || null, // Include chef assignment
      isNew: o === newOrder
    }));

    const scheduler = new HybridScheduler(allProcesses, {
      numChefs: chefIds.length,
      chefIds: chefIds,
      initialQuantum,
      historicalWaitFactor
    });

    const result = scheduler.run();

    // Find the completion time of the new order
    const newOrderResult = result.completed.find(p => p.isNew);
    const estimatedWaitMinutes = newOrderResult ? newOrderResult.completionTime : result.totalHospitalityTime;

    res.json({
      estimatedWaitMinutes: Math.ceil(estimatedWaitMinutes),
      totalKitchenLoad: result.totalHospitalityTime,
      individualOrders: result.completed
    });
  } catch (error) {
    console.error('Wait time calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =========================
   RAZORPAY – CREATE ORDER
========================= */
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount), // amount in paise (already converted by frontend)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // auto-capture
    };

    const order = await razorpay.orders.create(options);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create payment order" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});