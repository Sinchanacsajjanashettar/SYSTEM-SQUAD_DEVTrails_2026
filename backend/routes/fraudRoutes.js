const express = require('express');
const fraudValidationService = require('../services/fraudValidationService');
const Claim = require('../models/Claim');

const router = express.Router();

/**
 * POST /api/fraud/validate-claim
 * Execute full fraud validation pipeline
 */
router.post('/validate-claim', async (req, res) => {
  try {
    const claimData = req.body;

    if (!claimData.claimId || !claimData.claimType) {
      return res.status(400).json({
        error: 'claimId and claimType required',
        timestamp: new Date().toISOString()
      });
    }

    const fraudAssessment = await fraudValidationService.validateClaim(claimData);

    res.json({
      success: true,
      data: fraudAssessment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fraud validation error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fraud/statistics
 * Get fraud statistics (admin only)
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await fraudValidationService.getFraudStatistics();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fraud statistics error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fraud/flagged-workers
 * Get workers flagged for review (admin only)
 */
router.get('/flagged-workers', async (req, res) => {
  try {
    const { riskLevel = 'high' } = req.query;

    const flaggedWorkers = await fraudValidationService.getFlaggedWorkers(riskLevel);

    res.json({
      success: true,
      data: flaggedWorkers,
      riskLevel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Flagged workers error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fraud/claim/:claimId
 * Get fraud assessment for specific claim
 */
router.get('/claim/:claimId', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId)
      .select('claimId fraudScore riskLevel claimType claimAmount timestamp workerId')
      .lean();

    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: claim,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claim fraud lookup error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/fraud/dashboard
 * Get fraud dashboard data (admin only)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await fraudValidationService.getFraudStatistics();
    const flaggedWorkers = await fraudValidationService.getFlaggedWorkers('high');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentHighRiskClaims = await Claim.find({
      fraudScore: { $gte: 0.7 },
      timestamp: { $gte: thirtyDaysAgo }
    })
    .select('claimId claimType claimAmount fraudScore workerId timestamp')
    .limit(10)
    .lean();

    res.json({
      success: true,
      data: {
        statistics: stats,
        flaggedWorkers: flaggedWorkers.slice(0, 5),
        recentHighRiskClaims,
        suspiciousPatterns: {
          totalFlagged: stats.highRiskClaims + stats.mediumRiskClaims,
          requiring_manual_review: stats.mediumRiskClaims + stats.highRiskClaims,
          rejected_automatically: 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/fraud/manual-review
 * Mark claim for manual review
 */
router.post('/manual-review/:claimId', async (req, res) => {
  try {
    const { reason, reviewer } = req.body;

    const claim = await Claim.findByIdAndUpdate(
      req.params.claimId,
      {
        status: 'ManualReview',
        manualReviewReason: reason,
        reviewedBy: reviewer,
        reviewedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: claim,
      message: 'Claim marked for manual review',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manual review error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/fraud/override/:claimId
 * Admin override of fraud decision
 */
router.post('/override/:claimId', async (req, res) => {
  try {
    const { action, reason, overriddenBy } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'action must be approve or reject',
        timestamp: new Date().toISOString()
      });
    }

    const claim = await Claim.findByIdAndUpdate(
      req.params.claimId,
      {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        fraudOverride: true,
        fraudOverrideReason: reason,
        overriddenBy,
        overriddenAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: claim,
      message: `Claim manually ${action}ed`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Override error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
