const express = require("express");
const router = express.Router();
const { 
  createPolicy,
  getWorkerPolicy,
  getAllPolicies,
  renewPolicy,
  cancelPolicy,
  getAvailableDiscountsEndpoint
} = require("../controllers/policyController");

const { calculateFinalPremium } = require("../services/premiumCalculationService");

// Policy Management
router.post("/create", createPolicy);
router.get("/worker/:workerId", getWorkerPolicy);
router.get("/all", getAllPolicies);
router.put("/:policyId/renew", renewPolicy);
router.delete("/:policyId/cancel", cancelPolicy);

// Discounts
router.get("/worker/:workerId/discounts", getAvailableDiscountsEndpoint);

// Dynamic Premium Calculation
router.post("/calculate", async (req, res) => {
  try {
    const premiumData = await calculateFinalPremium(req.body);
    console.log("PremiumData returned:", premiumData); // ⭐ check here
    res.json(premiumData);
  } catch (err) {
    console.error("Premium calculation error:", err);
    res.status(500).json({ error: "Premium calculation failed" });
  }
});

module.exports = router;
