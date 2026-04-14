/**
 * UPI Payment Simulator
 * Simulates instant UPI payouts for demo purposes
 */

class UPISimulator {
  
  constructor() {
    this.successRate = 0.99;  // 99% success rate for demo
    this.processingTime = 3000;  // 3 seconds average
  }
  
  /**
   * Simulate UPI payout to worker
   * @param {Object} payoutData
   * @returns {Promise<Object>} Transaction result
   */
  async simulateUPIPayout(payoutData) {
    const {
      amount,
      upiId,
      claimId,
      workerId,
      reason = 'Insurance Claim Payout'
    } = payoutData;

    // Simulate processing delay
    await this.delay(Math.random() * 2000 + this.processingTime);

    // Check if transaction succeeds (99% success rate)
    const isSuccess = Math.random() < this.successRate;

    if (isSuccess) {
      const transactionId = `UPI_SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[UPISimulator] ✅ Payout successful: ${transactionId}`);
      
      return {
        status: 'success',
        transactionId,
        amount,
        upiId,
        workerId,
        claimId,
        timestamp: new Date().toISOString(),
        referenceId: `CLAIM_${claimId}`,
        message: '✅ Claim Approved. Funds transferred to your UPI.',
        processedAt: new Date()
      };
    } else {
      const transactionId = `UPI_SIM_FAIL_${Date.now()}`;
      
      console.log(`[UPISimulator] ❌ Payout failed: ${transactionId}`);
      
      return {
        status: 'failed',
        transactionId,
        amount,
        upiId,
        workerId,
        claimId,
        timestamp: new Date().toISOString(),
        referenceId: `CLAIM_${claimId}`,
        reason: 'Network timeout - Please retry',
        retryable: true,
        processedAt: new Date()
      };
    }
  }

  /**
   * Check payout status
   */
  async checkPayoutStatus(transactionId) {
    // Simulate status check
    return {
      transactionId,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(workerId, limit = 10) {
    // In production: query real transactions from database
    return {
      workerId,
      transactions: [],
      total: 0
    };
  }

  /**
   * Retry failed payout
   */
  async retryPayout(transactionId, payoutData) {
    console.log(`[UPISimulator] Retrying payout: ${transactionId}`);
    return await this.simulateUPIPayout(payoutData);
  }

  /**
   * Helper: Promise delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new UPISimulator();
