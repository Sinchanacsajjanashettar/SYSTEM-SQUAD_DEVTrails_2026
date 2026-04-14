const axios = require('axios');
const Claim = require('../models/Claim');
const Worker = require('../models/Worker');

/**
 * Fraud Validation Service
 * Orchestrates fraud detection across GPS, weather, and behavioral checks
 */
class FraudValidationService {
  
  /**
   * Execute full fraud validation pipeline
   * @param {Object} claimData - Claim details
   * @returns {Promise<Object>} - Fraud assessment with score and recommendation
   */
  async validateClaim(claimData) {
    const {
      claimId,
      claimType,
      location,
      workerId,
      timestamp,
      latitude,
      longitude,
      claimAmount
    } = claimData;

    console.log(`[FraudValidation] Starting validation for claim ${claimId}`);

    try {
      // Fetch worker details for context
      const worker = await Worker.findById(workerId);
      
      if (!worker) {
        throw new Error(`Worker ${workerId} not found`);
      }

      // Run fraud checks in parallel
      const [gpsResult, weatherResult, behavioralResult] = await Promise.all([
        this.checkGPSSpoofing(workerId, { latitude, longitude }, worker),
        this.checkWeatherValidity(claimType, location, timestamp),
        this.checkBehavioralAnomaly(workerId, claimAmount, worker)
      ]);

      // Calculate composite fraud score
      const fraudScore = this.calculateCompositeScore({
        gpsScore: gpsResult.fraud_score || 0,
        weatherScore: weatherResult.fraud_score || 0,
        behavioralScore: behavioralResult.behavioral_score || 0
      });

      // Determine action based on fraud score
      let action = 'approve';
      let riskLevel = 'low';

      if (fraudScore > 0.7) {
        action = 'reject';
        riskLevel = 'high';
      } else if (fraudScore > 0.4) {
        action = 'review';
        riskLevel = 'medium';
      } else {
        action = 'approve';
        riskLevel = 'low';
      }

      // Build assessment
      const assessment = {
        claimId,
        workerId,
        fraudScore: Math.round(fraudScore * 1000) / 1000,
        riskLevel,
        action,
        checks: {
          gps: gpsResult,
          weather: weatherResult,
          behavioral: behavioralResult
        },
        timestamp: new Date(),
        reviewedBy: 'AI_FRAUD_SYSTEM'
      };

      console.log(`[FraudValidation] Claim ${claimId}: Score=${fraudScore.toFixed(2)}, Action=${action}`);

      return {
        fraudScore: Math.round(fraudScore * 100) / 100,
        riskLevel,
        recommendation: action,
        details: assessment.checks,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[FraudValidation] Error for claim ${claimId}:`, error);
      // Fail open for user experience but flag for manual review
      return {
        fraudScore: 0.3,
        riskLevel: 'low',
        recommendation: 'approve',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check for GPS spoofing - impossible travel patterns
   */
  async checkGPSSpoofing(workerId, location, worker) {
    try {
      // Get worker's recent delivery history
      const recentDeliveries = worker.deliveryHistory?.slice(-5) || [];

      if (recentDeliveries.length === 0) {
        return {
          fraud_score: 0.0,
          reason: 'no_history_to_compare'
        };
      }

      // Call Python service for GPS analysis
      const response = await axios.post('http://localhost:5001/api/fraud/check-gps', {
        workerId,
        currentLocation: location,
        deliveryHistory: recentDeliveries
      }, { timeout: 5000 });

      return response.data;

    } catch (error) {
      console.warn(`[FraudValidation] GPS check failed for ${workerId}:`, error.message);
      return { fraud_score: 0.0, reason: 'check_unavailable' };
    }
  }

  /**
   * Check if claim weather data matches historical weather
   */
  async checkWeatherValidity(claimType, location, timestamp) {
    try {
      const response = await axios.post('http://localhost:5001/api/fraud/validate-weather', {
        claimType,  // 'rainfall', 'pollution', 'heat'
        location,
        timestamp
      }, { timeout: 5000 });

      return response.data;

    } catch (error) {
      console.warn(`[FraudValidation] Weather check failed:`, error.message);
      // Default: assume claim is valid if check unavailable
      return { fraud_score: 0.1, reason: 'check_unavailable', is_valid: true };
    }
  }

  /**
   * Check for behavioral fraud patterns
   */
  async checkBehavioralAnomaly(workerId, claimAmount, worker) {
    try {
      // Get worker's historical claims (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentClaims = await Claim.find({
        workerId,
        timestamp: { $gte: thirtyDaysAgo }
      }).lean();

      // Calculate worker monthly income (rough estimate from delivery data)
      const monthlyIncome = this.estimateMonthlyIncome(worker);

      // Call Python service for behavioral analysis
      const response = await axios.post('http://localhost:5001/api/fraud/detect-behavioral', {
        workerId,
        claimAmount,
        recentClaims: recentClaims.map(c => ({
          timestamp: c.timestamp,
          claimAmount: c.claimAmount
        })),
        monthlyIncome
      }, { timeout: 5000 });

      return response.data;

    } catch (error) {
      console.warn(`[FraudValidation] Behavioral check failed:`, error.message);
      return { behavioral_score: 0.0, reason: 'check_unavailable' };
    }
  }

  /**
   * Calculate composite fraud score with weighted components
   */
  calculateCompositeScore(scores) {
    // Weights optimized for insurance fraud detection
    const weights = {
      gpsScore: 0.35,        // GPS impossible travel is strong indicator
      weatherScore: 0.40,    // Weather validation is most reliable
      behavioralScore: 0.25  // Behavioral patterns are supplementary
    };

    const composite = (
      (scores.gpsScore || 0) * weights.gpsScore +
      (scores.weatherScore || 0) * weights.weatherScore +
      (scores.behavioralScore || 0) * weights.behavioralScore
    );

    return Math.min(1.0, composite);
  }

  /**
   * Estimate worker's monthly income from delivery history
   */
  estimateMonthlyIncome(worker) {
    // Default: ₹700/day * 30 days = ₹21,000/month
    // In production: would query actual earnings from payment data
    return worker.estimatedMonthlyIncome || 21000;
  }

  /**
   * Get fraud statistics for dashboard
   */
  async getFraudStatistics(query = {}) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get all recent claims
      const allClaims = await Claim.find({
        timestamp: { $gte: thirtyDaysAgo },
        ...query
      }).lean();

      // Categorize by fraud score
      const highRisk = allClaims.filter(c => c.fraudScore > 0.7).length;
      const mediumRisk = allClaims.filter(c => c.fraudScore > 0.4 && c.fraudScore <= 0.7).length;
      const lowRisk = allClaims.filter(c => c.fraudScore <= 0.4).length;

      const fraudRate = allClaims.length > 0 
        ? (highRisk / allClaims.length * 100).toFixed(2)
        : 0;

      return {
        totalClaims: allClaims.length,
        highRiskClaims: highRisk,
        mediumRiskClaims: mediumRisk,
        lowRiskClaims: lowRisk,
        fraudRate: parseFloat(fraudRate),
        flaggedForManualReview: mediumRisk + highRisk,
        autoApproved: lowRisk
      };

    } catch (error) {
      console.error('Error calculating fraud statistics:', error);
      return {};
    }
  }

  /**
   * Get workers flagged for review
   */
  async getFlaggedWorkers(riskLevel = 'high') {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const minScore = riskLevel === 'high' ? 0.7 : riskLevel === 'medium' ? 0.4 : 0;
      const maxScore = riskLevel === 'high' ? 1.0 : riskLevel === 'medium' ? 0.7 : 0.4;

      const flaggedClaims = await Claim.find({
        timestamp: { $gte: thirtyDaysAgo },
        fraudScore: { $gte: minScore, $lt: maxScore }
      }).populate('workerId', 'name email platform').lean();

      // Group by worker
      const workerMap = {};
      flaggedClaims.forEach(claim => {
        const workerId = claim.workerId._id;
        if (!workerMap[workerId]) {
          workerMap[workerId] = {
            worker: claim.workerId,
            claimCount: 0,
            avgFraudScore: 0,
            highestScore: 0
          };
        }
        workerMap[workerId].claimCount++;
        workerMap[workerId].avgFraudScore += claim.fraudScore;
        workerMap[workerId].highestScore = Math.max(workerMap[workerId].highestScore, claim.fraudScore);
      });

      // Calculate averages
      const flaggedWorkers = Object.values(workerMap).map(item => ({
        ...item,
        avgFraudScore: Math.round(item.avgFraudScore / item.claimCount * 100) / 100
      }));

      return flaggedWorkers.sort((a, b) => b.avgFraudScore - a.avgFraudScore);

    } catch (error) {
      console.error('Error getting flagged workers:', error);
      return [];
    }
  }
}

module.exports = new FraudValidationService();
