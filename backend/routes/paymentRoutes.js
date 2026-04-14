const express = require('express');
const payoutOrchestrator = require('../services/payoutOrchestratorService');
const fraudValidationService = require('../services/fraudValidationService');
const Claim = require('../models/Claim');

const router = express.Router();

/**
 * POST /api/payments/process-payout
 * Initiate payout for an approved claim
 */
router.post('/process-payout', async (req, res) => {
  try {
    const { claimId } = req.body;

    if (!claimId) {
      return res.status(400).json({ 
        error: 'claimId required',
        timestamp: new Date().toISOString()
      });
    }

    // Find claim
    const claim = await Claim.findById(claimId).populate('workerId');

    if (!claim) {
      return res.status(404).json({ 
        error: 'Claim not found',
        timestamp: new Date().toISOString()
      });
    }

    // Process payout
    const result = await payoutOrchestrator.processPayout(claimId, claim);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/payments/retry-payout/:claimId
 * Retry failed payout
 */
router.post('/retry-payout/:claimId', async (req, res) => {
  try {
    const result = await payoutOrchestrator.retryFailedPayout(req.params.claimId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Retry error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/payments/history/:workerId
 * Get payment/payout history for a worker
 */
router.get('/history/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { limit = 30 } = req.query;

    const history = await payoutOrchestrator.getPayoutHistory(workerId, parseInt(limit));

    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/payments/statistics
 * Get payment statistics (admin only)
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await payoutOrchestrator.getPayoutStatistics();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/payments/failed
 * Get failed payouts for retry (admin only)
 */
router.get('/failed', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const failedPayouts = await payoutOrchestrator.getFailedPayouts(parseInt(limit));

    res.json({
      success: true,
      data: failedPayouts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed payouts error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/payments/status/:transactionId
 * Check payout status
 */
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find claim with this transaction ID
    const claim = await Claim.findOne({ transactionId })
      .select('claimId transactionId payoutStatus payoutAmount payoutTimestamp')
      .lean();

    if (!claim) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        transactionId,
        claimId: claim.claimId,
        status: claim.payoutStatus,
        amount: claim.payoutAmount,
        processedAt: claim.payoutTimestamp
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
