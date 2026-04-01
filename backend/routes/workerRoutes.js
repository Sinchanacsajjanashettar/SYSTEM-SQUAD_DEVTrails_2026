const express = require("express");
const router = express.Router();
const { 
  registerWorker, 
  loginWorker,
  getWorkerProfile,
  getWorkerByPhone,
  updateWorkerProfile,
  getWorkerRiskScore,
  deactivateWorker
} = require("../controllers/workerController");

// Authentication Routes
router.post("/register", registerWorker);
router.post("/login", loginWorker);

// Get Worker by Phone (for login)
router.get("/phone/:phone", getWorkerByPhone);

// Profile Routes
router.get("/:workerId", getWorkerProfile);
router.put("/:workerId", updateWorkerProfile);

// Risk Assessment Routes
router.get("/:workerId/risk-score", getWorkerRiskScore);

// Account Management
router.delete("/:workerId/deactivate", deactivateWorker);

module.exports = router;
