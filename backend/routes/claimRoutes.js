const express = require("express");
const router = express.Router();
const { 
  createClaim,
  createAutoApprovedClaim,
  getClaimHistory,
  getAllClaims,
  getClaimDetails,
  reviewClaimEndpoint,
  cancelClaimEndpoint,
  retryPayout,
  createBulkClaims
} = require("../controllers/claimController");

// Claim Creation
router.post("/create", createClaim);
router.post("/auto-approve", createAutoApprovedClaim);
router.post("/bulk", createBulkClaims);

// Claim Retrieval
router.get("/history/:workerId", getClaimHistory);
router.get("/all", getAllClaims);
router.get("/:claimId", getClaimDetails);

// Claim Management
router.put("/:claimId/review", reviewClaimEndpoint);
router.delete("/:claimId/cancel", cancelClaimEndpoint);
router.post("/:claimId/retry-payout", retryPayout);

module.exports = router;
