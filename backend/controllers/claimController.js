const Claim = require("../models/Claim");
const {
  createAutoApprovedClaim,
  getWorkerClaimHistory,
  reviewClaim,
  cancelClaim,
  processBulkAutoClaims
} = require("../services/claimService");

/**
 * Create Auto-Approved Claim (Zero-Touch)
 * Called when triggers are activated
 */
exports.createAutoApprovedClaim = async (req, res) => {
  try {
    const { workerId, triggerData } = req.body;

    console.log('📥 Claim Trigger Request:', { workerId, triggerData });

    if (!workerId || !triggerData || !triggerData.trigger) {
      console.error('❌ Missing fields:', { workerId, triggerData });
      return res.status(400).json({ 
        message: "Missing required fields: workerId, triggerData.trigger"
      });
    }

    // Call claim service for auto-approval
    console.log('🔄 Calling claimService.createAutoApprovedClaim...');
    const claimResult = await createAutoApprovedClaim(workerId, triggerData);

    if (claimResult.success) {
      res.status(201).json({
        message: "Claim auto-approved and payout initiated",
        ...claimResult
      });
    } else {
      res.status(400).json({
        message: "Claim could not be processed",
        reason: claimResult.reason
      });
    }
  } catch (error) {
    console.error("Auto-claim creation error:", error);
    res.status(500).json({ message: "Error creating claim", error: error.message });
  }
};

/**
 * Get Worker's Claim History with Statistics
 */
exports.getClaimHistory = async (req, res) => {
  try {
    const { workerId } = req.params;

    const historyData = await getWorkerClaimHistory(workerId);

    res.status(200).json({
      workerId,
      ...historyData
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching claim history", error: error.message });
  }
};

/**
 * Get All Claims (Admin Dashboard)
 */
exports.getAllClaims = async (req, res) => {
  try {
    const { status, days = 30 } = req.query;

    const query = {
      triggeredAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };

    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate('workerId', 'name platform location')
      .sort({ triggeredAt: -1 });

    const stats = {
      total: claims.length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
      paid: claims.filter(c => c.payoutStatus === 'success').length,
      totalPayouts: claims
        .filter(c => c.payoutStatus === 'success')
        .reduce((sum, c) => sum + c.claimAmount, 0),
      byTriggerType: {}
    };

    claims.forEach(claim => {
      stats.byTriggerType[claim.claimType] = (stats.byTriggerType[claim.claimType] || 0) + 1;
    });

    res.status(200).json({
      claims,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching claims", error: error.message });
  }
};

/**
 * Get Single Claim Details
 */
exports.getClaimDetails = async (req, res) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId)
      .populate('workerId', 'name platform location upiHandle')
      .populate('policyId', 'weeklyPremium coverageHours');

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: "Error fetching claim", error: error.message });
  }
};

/**
 * Review Claim (Manual review for edge cases)
 */
exports.reviewClaimEndpoint = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await reviewClaim(claimId, status, reviewNotes);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ message: "Error reviewing claim", error: error.message });
  }
};

/**
 * Cancel Claim
 */
exports.cancelClaimEndpoint = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Cancellation reason required" });
    }

    const result = await cancelClaim(claimId, reason);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ message: "Error cancelling claim", error: error.message });
  }
};

/**
 * Retry Failed Payout
 */
exports.retryPayout = async (req, res) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.payoutStatus === 'success') {
      return res.status(400).json({ message: "Payout already successful" });
    }

    // Simulate retry
    claim.payoutStatus = 'initiated';
    claim.updatedAt = new Date();
    await claim.save();

    res.status(200).json({
      message: "Payout retry initiated",
      claim
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrying payout", error: error.message });
  }
};

/**
 * Create Bulk Claims (when trigger affects multiple workers)
 */
exports.createBulkClaims = async (req, res) => {
  try {
    const { workerIds, triggerData } = req.body;

    if (!Array.isArray(workerIds) || workerIds.length === 0) {
      return res.status(400).json({ message: "worker Ids array required" });
    }

    if (!triggerData || !triggerData.trigger) {
      return res.status(400).json({ message: "Trigger data required" });
    }

    const results = await processBulkAutoClaims(workerIds, triggerData);

    res.status(201).json({
      message: "Bulk claims processed",
      results
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing bulk claims", error: error.message });
  }
};

/**
 * Legacy endpoint for backward compatibility
 */
exports.createClaim = async (req, res) => {
  try {
    const claim = new Claim({
      workerId: req.body.workerId,
      claimType: 'HEAVY_RAINFALL',
      claimAmount: 300,
      status: "approved"
    });

    await claim.save();
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: "Error creating claim", error: error.message });
  }
};
