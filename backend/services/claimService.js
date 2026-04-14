const Claim = require("../models/Claim");
const Worker = require("../models/Worker");
const Policy = require("../models/Policy");
const fraudValidationService = require("./fraudValidationService");

/**
 * Advanced Claim Processing Service
 * Implements zero-touch, automatic claim approval & payout
 */

/**
 * Verify if worker has active policy covering the trigger type
 */
exports.verifyPolicyCoverage = async (workerId, triggerType) => {
  try {
    const policy = await Policy.findOne({
      workerId,
      active: true,
      status: 'active',
      coverageStartDate: { $lte: new Date() },
      coverageEndDate: { $gte: new Date() }
    });

    if (!policy) {
      return { covered: false, reason: 'No active policy found' };
    }

    // Check if trigger type is enabled in policy
    const triggerMap = {
      'HEAVY_RAINFALL': 'rainfall',
      'SEVERE_POLLUTION': 'aqi',
      'EXTREME_HEAT': 'heat',
      'SEVERE_CONGESTION': 'traffic',
      'CURFEW_LOCKDOWN': 'curfew'
    };

    const enabledTrigger = triggerMap[triggerType];
    if (!policy.enabledTriggers[enabledTrigger]) {
      return { covered: false, reason: `${triggerType} not covered under current policy` };
    }

    return { covered: true, policy, claimLimit: policy.maxCoverageAmount };
  } catch (err) {
    console.error('Policy verification error:', err);
    return { covered: false, reason: 'Error verifying policy' };
  }
};

/**
 * Check if multiple claims already exist for same trigger type
 * Prevent duplicate claims within 24 hours
 */
exports.checkDuplicateClaim = async (workerId, triggerType) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingClaim = await Claim.findOne({
      workerId,
      claimType: triggerType,
      triggeredAt: { $gte: last24Hours }
    });

    return !existingClaim; // Return true if no duplicate
  } catch (err) {
    console.error('Duplicate check error:', err);
    return true; // Allow claim on error (fail-safe)
  }
};

/**
 * Create and auto-approve claim (ZERO-TOUCH process)
 * This is the core of the parametric insurance model
 */
exports.createAutoApprovedClaim = async (workerId, triggerData) => {
  try {
    // Step 1: Verify worker exists and has active policy
    const worker = await Worker.findById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    // Step 2: Verify policy coverage
    const coverageCheck = await exports.verifyPolicyCoverage(workerId, triggerData.trigger);
    if (!coverageCheck.covered) {
      console.log(`❌ Claim blocked: ${coverageCheck.reason}`);
      return {
        success: false,
        reason: coverageCheck.reason,
        claim: null
      };
    }

    // Step 3: Check for duplicate claims
    const noDuplicate = await exports.checkDuplicateClaim(workerId, triggerData.trigger);
    if (!noDuplicate) {
      console.log('⚠️ Duplicate claim prevented within 24 hours');
      return {
        success: false,
        reason: 'Duplicate claim detected. Max 1 claim per 24 hours per trigger.',
        claim: null
      };
    }

    // Step 4: Create claim with AUTO STATUS
    const claim = new Claim({
      workerId,
      policyId: coverageCheck.policy._id,
      claimType: triggerData.trigger,
      claimAmount: triggerData.claimAmount,
      status: 'approved', // AUTO-APPROVED (ZERO-TOUCH)
      triggerData: {
        rainfall: triggerData.trigger === 'HEAVY_RAINFALL' ? triggerData.value : null,
        aqi: triggerData.trigger === 'SEVERE_POLLUTION' ? triggerData.value : null,
        temperature: triggerData.trigger === 'EXTREME_HEAT' ? triggerData.value : null,
        congestionIndex: triggerData.trigger === 'SEVERE_CONGESTION' ? triggerData.value : null,
        curfewActive: triggerData.trigger === 'CURFEW_LOCKDOWN' ? triggerData.value : false,
        timestamp: new Date()
      },
      payoutMethod: 'upi',
      payoutUPI: worker.upiHandle,
      payoutStatus: 'initiated',
      autoApprovalReason: `Parametric trigger activated: ${triggerData.coverage}`,
      // Will be updated with actual ML fraud score below
      fraudScore: 0.1
    });

    // Validate claim with ML fraud detection
    console.log(`🔍 Running ML fraud detection for claim...`);
    const fraudAssessment = await fraudValidationService.validateClaim({
      claimId: claim._id.toString(),
      claimType: triggerData.trigger,
      location: triggerData.location || 'Unknown',
      workerId: workerId,
      timestamp: new Date(),
      latitude: triggerData.latitude || 0,
      longitude: triggerData.longitude || 0,
      claimAmount: triggerData.claimAmount
    });

    // Update claim with ML-based fraud score
    claim.fraudScore = fraudAssessment.fraudScore || 0.1;
    claim.riskLevel = fraudAssessment.riskLevel || 'low';
    claim.fraudDetails = fraudAssessment.details || {};

    console.log(`📊 ML Fraud Score: ${claim.fraudScore}, Risk: ${claim.riskLevel}`);

    await claim.save();

    // Step 5: Trigger actual payout
    const payoutResult = await exports.initiateUPIPayout(worker, claim);

    return {
      success: true,
      claim: claim.toObject(),
      payout: payoutResult,
      message: `✅ Claim ₹${claim.claimAmount} auto-approved and payout initiated`
    };

  } catch (err) {
    console.error('❌ Auto-claim creation error:', err);
    return {
      success: false,
      reason: err.message,
      claim: null
    };
  }
};

/**
 * Initiate UPI Payout (Mock Implementation)
 * In production, integrate with actual UPI provider (Google Pay, BHIM API, etc.)
 */
exports.initiateUPIPayout = async (worker, claim) => {
  try {
    if (!worker.upiHandle) {
      throw new Error('UPI handle not configured for worker');
    }

    // Mock UPI transaction (simulate instant transfer)
    const transactionId = `GS-${Date.now()}-${Math.random().toString().slice(2, 8)}`;

    // Update claim with payout details
    claim.payoutStatus = 'success';
    claim.paidAt = new Date();
    claim.transactionId = transactionId;
    await claim.save();

    return {
      success: true,
      method: 'upi',
      upiHandle: worker.upiHandle,
      amount: claim.claimAmount,
      transactionId,
      timestamp: new Date(),
      message: `💰 ₹${claim.claimAmount} transferred to ${worker.upiHandle}`
    };

  } catch (err) {
    console.error('UPI Payout error:', err);
    // Mark claim as failed payout instead of blocking
    claim.payoutStatus = 'failed';
    await claim.save();
    
    return {
      success: false,
      method: 'upi',
      error: err.message,
      nextRetry: new Date(Date.now() + 30 * 60 * 1000) // Retry in 30 mins
    };
  }
};

/**
 * Bulk auto-claim processing for multiple triggered workers
 * Called from monitoring system when triggers activate
 */
exports.processBulkAutoClaims = async (triggeredWorkers, triggerData) => {
  const results = {
    total: triggeredWorkers.length,
    approved: 0,
    rejected: 0,
    totalPayouts: 0,
    claims: []
  };

  for (const workerId of triggeredWorkers) {
    const claimResult = await exports.createAutoApprovedClaim(workerId, triggerData);
    
    if (claimResult.success) {
      results.approved++;
      results.totalPayouts += claimResult.claim.claimAmount;
      results.claims.push({
        workerId,
        claimId: claimResult.claim._id,
        amount: claimResult.claim.claimAmount,
        status: 'approved'
      });
    } else {
      results.rejected++;
      results.claims.push({
        workerId,
        reason: claimResult.reason,
        status: 'rejected'
      });
    }
  }

  console.log(`📊 Bulk claim processing: ${results.approved} approved, ${results.rejected} rejected`);
  return results;
};

/**
 * Get worker's claim history with statistics
 */
exports.getWorkerClaimHistory = async (workerId) => {
  try {
    const claims = await Claim.find({ workerId }).sort({ triggeredAt: -1 });
    
    const stats = {
      totalClaims: claims.length,
      approvedClaims: claims.filter(c => c.status === 'approved').length,
      totalAmountPaid: claims
        .filter(c => c.status === 'paid' || c.payoutStatus === 'success')
        .reduce((sum, c) => sum + c.claimAmount, 0),
      claimsByType: {}
    };

    // Count claims by type
    claims.forEach(claim => {
      stats.claimsByType[claim.claimType] = (stats.claimsByType[claim.claimType] || 0) + 1;
    });

    return {
      claims,
      statistics: stats
    };
  } catch (err) {
    console.error('Error fetching claim history:', err);
    return { claims: [], statistics: {} };
  }
};

/**
 * Manual claim review (for edge cases or disputes)
 */
exports.reviewClaim = async (claimId, status, reviewNotes) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      claimId,
      {
        status,
        reviewNotes,
        updatedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      claim,
      message: `Claim review complete - Status: ${status}`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Cancel a pending claim
 */
exports.cancelClaim = async (claimId, reason) => {
  try {
    const claim = await Claim.findById(claimId);
    
    if (claim.payoutStatus === 'success') {
      throw new Error('Cannot cancel claim - payout already processed');
    }

    claim.status = 'rejected';
    claim.reviewNotes = `Cancelled: ${reason}`;
    await claim.save();

    return {
      success: true,
      claim,
      message: 'Claim cancelled successfully'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};

// Legacy function for backward compatibility
exports.autoClaim = async (workerId) => {
  const claim = new Claim({
    workerId,
    claimType: 'HEAVY_RAINFALL',
    claimAmount: 300,
    status: "approved",
    fraudScore: 0.1
  });

  await claim.save();
  console.log("💰 Claim stored in DB");
};