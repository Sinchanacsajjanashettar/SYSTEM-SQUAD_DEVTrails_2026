const upiSimulator = require('./upiSimulator');
const Claim = require('../models/Claim');
const Worker = require('../models/Worker');

/**
 * Payout Orchestrator Service
 * Manages the complete payout workflow:
 * Claim Approved → Validate Worker/UPI → Initiate Payout → Update Status
 */
class PayoutOrchestratorService {
  
  /**
   * Main orchestration flow for processing payout
   */
  async processPayout(claimId, claim) {
    const startTime = Date.now();
    
    try {
      console.log(`[PayoutOrchestrator] Processing claim ${claimId}...`);

      // Step 1: Validate claim and worker
      if (!claim || !claim.workerId) {
        throw new Error('Invalid claim data');
      }

      const worker = await Worker.findById(claim.workerId);
      if (!worker) {
        throw new Error('Worker not found');
      }

      if (!worker.upiAddress) {
        throw new Error('Worker UPI not configured');
      }

      const { claimAmount } = claim;
      const upiAddress = worker.upiAddress;

      // Step 2: Initiate payout via UPI simulator
      console.log(`[PayoutOrchestrator] Initiating payout: ₹${claimAmount} to ${upiAddress}`);

      const payoutResult = await upiSimulator.simulateUPIPayout({
        amount: claimAmount,
        upiId: upiAddress,
        claimId: claimId.toString(),
        workerId: worker._id.toString(),
        reason: `${claim.claimType} Insurance Claim Payout`
      });

      // Step 3: Update claim with payout status
      claim.payoutStatus = 'Initiated';
      claim.transactionId = payoutResult.transactionId;
      claim.payoutTimestamp = new Date();
      claim.payoutAmount = claimAmount;
      
      await claim.save();

      const processingTime = Date.now() - startTime;
      console.log(`[PayoutOrchestrator] Payout initiated for claim ${claimId} in ${processingTime}ms`);

      // Step 4: Schedule completion update (simulate async webhook)
      this.schedulePayoutCompletion(claimId, payoutResult.status);

      return {
        status: payoutResult.status,
        message: payoutResult.message || 'Payout processed successfully',
        transactionId: payoutResult.transactionId,
        amount: claimAmount,
        upi: upiAddress,
        processingTime: `${processingTime}ms`,
        timestamp: payoutResult.timestamp,
        claim: {
          claimId: claimId.toString(),
          claimType: claim.claimType,
          workerName: worker.name
        }
      };

    } catch (error) {
      console.error(`[PayoutOrchestrator] Error processing payout for claim ${claimId}:`, error);
      
      // Update claim with error status
      try {
        claim.payoutStatus = 'Failed';
        claim.payoutError = error.message;
        await claim.save();
      } catch (e) {
        console.error('Error updating claim status:', e);
      }

      throw error;
    }
  }

  /**
   * Schedule async completion of payout (simulates webhook callback)
   */
  schedulePayoutCompletion(claimId, payoutStatus) {
    setTimeout(async () => {
      try {
        const claim = await Claim.findById(claimId);
        
        if (!claim) {
          console.warn(`[PayoutOrchestrator] Claim ${claimId} not found for completion`);
          return;
        }

        // Update to final status
        if (payoutStatus === 'success') {
          claim.payoutStatus = 'Completed';
          claim.status = 'Approved';
          console.log(`[PayoutOrchestrator] ✅ Claim ${claimId} payout completed successfully`);
        } else {
          claim.payoutStatus = 'Failed';
          claim.status = 'Rejected';
          console.log(`[PayoutOrchestrator] ❌ Claim ${claimId} payout failed`);
        }

        await claim.save();

      } catch (error) {
        console.error(`[PayoutOrchestrator] Error completing payout for ${claimId}:`, error);
      }
    }, 2000);  // Complete after 2 seconds
  }

  /**
   * Retry failed payout
   */
  async retryFailedPayout(claimId) {
    try {
      console.log(`[PayoutOrchestrator] Retrying failed payout for claim ${claimId}`);

      const claim = await Claim.findById(claimId).populate('workerId');
      
      if (!claim) {
        throw new Error('Claim not found');
      }

      if (claim.payoutStatus !== 'Failed') {
        throw new Error(`Cannot retry payout with status: ${claim.payoutStatus}`);
      }

      // Reset payout status and retry
      claim.payoutStatus = 'Pending';
      claim.payoutError = null;
      await claim.save();

      // Process again
      return await this.processPayout(claimId, claim);

    } catch (error) {
      console.error(`[PayoutOrchestrator] Retry error for claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Get payout history for worker
   */
  async getPayoutHistory(workerId, limit = 30) {
    try {
      const claims = await Claim.find({
        workerId,
        payoutStatus: { $in: ['completed', 'initiated', 'failed', 'pending', 'success', 'Completed', 'Initiated', 'Failed', 'Pending'] }
      })
      .select('claimId claimType claimAmount payoutStatus transactionId paidAt timestamp createdAt')
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

      return {
        workerId: workerId.toString(),
        totalTransactions: claims.length,
        transactions: claims.map(c => ({
          claimId: c.claimId,
          claimType: c.claimType,
          amount: c.claimAmount,
          status: c.payoutStatus || 'completed',
          transactionId: c.transactionId,
          date: c.paidAt || c.timestamp || c.createdAt || new Date(),
          link: `/claims/${c.claimId}`
        }))
      };

    } catch (error) {
      console.error('Error fetching payout history:', error);
      return { workerId, totalTransactions: 0, transactions: [] };
    }
  }

  /**
   * Get payout statistics for admin dashboard
   */
  async getPayoutStatistics(query = {}) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const stats = await Claim.aggregate([
        {
          $match: {
            payoutTimestamp: { $gte: thirtyDaysAgo },
            ...query
          }
        },
        {
          $group: {
            _id: '$payoutStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$claimAmount' },
            avgAmount: { $avg: '$claimAmount' }
          }
        }
      ]);

      const result = {
        completed: { count: 0, totalAmount: 0, avgAmount: 0 },
        initiated: { count: 0, totalAmount: 0, avgAmount: 0 },
        failed: { count: 0, totalAmount: 0, avgAmount: 0 },
        pending: { count: 0, totalAmount: 0, avgAmount: 0 }
      };

      stats.forEach(stat => {
        const status = (stat._id || 'pending').toLowerCase();
        if (result[status]) {
          result[status] = {
            count: stat.count,
            totalAmount: Math.round(stat.totalAmount),
            avgAmount: Math.round(stat.avgAmount)
          };
        }
      });

      // Calculate overall metrics
      const total = stats.reduce((sum, s) => sum + s.count, 0);
      const totalAmount = stats.reduce((sum, s) => sum + s.totalAmount, 0);

      return {
        summary: {
          totalPayouts: total,
          totalAmount: Math.round(totalAmount),
          avgAmount: total > 0 ? Math.round(totalAmount / total) : 0,
          successRate: total > 0 ? ((result.completed.count / total) * 100).toFixed(2) : 0
        },
        breakdown: result
      };

    } catch (error) {
      console.error('Error calculating payout statistics:', error);
      return { summary: {}, breakdown: {} };
    }
  }

  /**
   * Get failed payouts for retry
   */
  async getFailedPayouts(limit = 10) {
    try {
      const failedClaims = await Claim.find({
        payoutStatus: 'Failed'
      })
      .populate('workerId', 'name email upiAddress')
      .select('claimId claimAmount claimType payoutError transactionId payoutTimestamp')
      .sort({ payoutTimestamp: -1 })
      .limit(limit)
      .lean();

      return failedClaims.map(c => ({
        claimId: c.claimId,
        amount: c.claimAmount,
        type: c.claimType,
        error: c.payoutError,
        transactionId: c.transactionId,
        worker: {
          name: c.workerId?.name,
          email: c.workerId?.email,
          upi: c.workerId?.upiAddress
        },
        failedAt: c.payoutTimestamp,
        action: 'retry'
      }));

    } catch (error) {
      console.error('Error fetching failed payouts:', error);
      return [];
    }
  }
}

module.exports = new PayoutOrchestratorService();
