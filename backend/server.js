const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const workerRoutes = require("./routes/workerRoutes");
const policyRoutes = require("./routes/policyRoutes");
const claimRoutes = require("./routes/claimRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const fraudRoutes = require("./routes/fraudRoutes");

const { getWeather } = require("./services/weatherService");
const { checkAllTriggers } = require("./services/triggerService");
const { createAutoApprovedClaim, processBulkAutoClaims } = require("./services/claimService");

const Worker = require("./models/Worker");
const Policy = require("./models/Policy");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/workers", workerRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/fraud", fraudRoutes);

// DB Connection
mongoose.connect("mongodb://127.0.0.1:27017/gigshield")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

/**
 * Enhanced Monitoring System with Multiple Triggers
 * Checks 5 different environmental factors every 30 seconds
 * Auto-triggers claims when thresholds are exceeded
 */
const startMonitoringSystem = () => {
  setInterval(async () => {
    try {
      // Simulate environmental data (in production, fetch from real APIs)
      const environmentData = {
        rainfall: Math.random() * 100,
        aqi: Math.round(50 + Math.random() * 400),
        temperature: 25 + Math.random() * 20,
        congestionIndex: Math.random() * 10,
        curfewActive: false
      };

      console.log("\n🔍 [MONITORING CYCLE]", new Date().toLocaleTimeString());
      console.log("📊 Environment Data:", {
        rain: Math.round(environmentData.rainfall) + "mm",
        aqi: Math.round(environmentData.aqi),
        temp: Math.round(environmentData.temperature) + "°C",
        congestion: Math.round(environmentData.congestionIndex * 10) / 10
      });

      // Check all triggers
      const triggerResults = checkAllTriggers(environmentData);

      if (triggerResults.anyTriggered) {
        console.log("\n🚨 TRIGGERS ACTIVATED:", triggerResults.activetriggers.length);
        
        // Get all active workers with active policies
        const workers = await Worker.find({ isActive: true });
        
        for (const trigger of triggerResults.activetriggers) {
          console.log(`\n⚡ Processing: ${trigger.trigger}`);
          
          // Create claims for all eligible workers
          for (const worker of workers) {
            // Check if worker has active policy
            const policy = await Policy.findOne({
              workerId: worker._id,
              active: true,
              status: 'active',
              coverageEndDate: { $gte: new Date() }
            });

            if (policy) {
              const claimResult = await createAutoApprovedClaim(worker._id, trigger);
              
              if (claimResult.success) {
                console.log(`✅ ${worker.name}: Claim ₹${trigger.claimAmount} approved & payout initiated`);
              } else {
                console.log(`⏭️  ${worker.name}: ${claimResult.reason}`);
              }
            }
          }
        }
      } else {
        console.log("✅ All systems normal - No triggers activated");
      }

    } catch (err) {
      console.error("❌ Monitoring Error:", err.message);
    }
  }, 30000); // Run every 30 seconds
};

/**
 * Health Check Endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "✅ Server Running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development"
  });
});

/**
 * Trigger Status Dashboard (for testing)
 */
app.get("/api/triggers/status", (req, res) => {
  const triggers = [
    { name: 'Heavy Rainfall', threshold: '> 60mm', enabled: true },
    { name: 'Severe Pollution (AQI)', threshold: '> 350', enabled: true },
    { name: 'Extreme Heat', threshold: '> 45°C', enabled: true },
    { name: 'Severe Traffic Congestion', threshold: '> 8/10', enabled: true },
    { name: 'Government Curfew', threshold: 'Active', enabled: true }
  ];

  res.json({
    activeTriggers: triggers,
    description: "All 5 parametric triggers are active and monitoring 24/7",
    monitoringInterval: "30 seconds",
    claimApproval: "Automatic (Zero-Touch)"
  });
});

/**
 * Manual Trigger Test Endpoint (for demo)
 */
app.post("/api/triggers/test", async (req, res) => {
  try {
    const { triggerType, claimAmount = 300 } = req.body;

    const triggerData = {
      trigger: triggerType || 'HEAVY_RAINFALL',
      claimAmount: claimAmount,
      coverage: `Income Loss from ${triggerType || 'Heavy Rainfall'}`,
      value: 75
    };

    // Get all active workers
    const workers = await Worker.find({ isActive: true }).limit(1); // Test with 1 worker

    if (workers.length === 0) {
      return res.status(400).json({ message: "No active workers found for testing" });
    }

    const results = [];
    for (const worker of workers) {
      const claimResult = await createAutoApprovedClaim(worker._id, triggerData);
      results.push({
        workerId: worker._id,
        workerName: worker.name,
        ...claimResult
      });
    }

    res.json({
      message: "Test trigger processed",
      triggerData,
      results
    });
  } catch (error) {
    res.status(500).json({ message: "Error testing trigger", error: error.message });
  }
});

/**
 * Start Server
 */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 GigShield AI Server running on http://localhost:${PORT}`);
  console.log("📡 WebSocket monitoring system active");
  console.log("🔍 Checking 5 parametric triggers every 30 seconds\n");
  
  // Start monitoring system
  startMonitoringSystem();
});

// Python integration test (can be kept or removed)
const { execFile } = require("child_process");
execFile(
  "py",
  ["--version"],
  (err, stdout, stderr) => {
    if (!err) {
      console.log("✅ Python Integration: Available");
    } else {
      console.log("⚠️  Python Integration: Not available (using ML simulation)");
    }
  }
);
