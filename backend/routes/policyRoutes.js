const express = require("express");
const router = express.Router();
const { 
  createPolicy,
  calculatePremium,
  getWorkerPolicy,
  getAllPolicies,
  renewPolicy,
  cancelPolicy,
  getAvailableDiscountsEndpoint
} = require("../controllers/policyController");

// Policy Management
router.post("/create", createPolicy);
router.post("/calculate", calculatePremium);
router.get("/worker/:workerId", getWorkerPolicy);
router.get("/all", getAllPolicies);
router.put("/:policyId/renew", renewPolicy);
router.delete("/:policyId/cancel", cancelPolicy);

// Discounts
router.get("/worker/:workerId/discounts", getAvailableDiscountsEndpoint);

module.exports = router;
