const axios = require("axios");

/**
 * Dynamic Premium Calculation Service
 * Calculates insurance premiums based on:
 * - Worker's location risk profile
 * - Historical incident data (weather, pollution)
 * - ML predictions from Python models
 */

// Base premium for gig workers (weekly)
const BASE_PREMIUM = {
  delivery: 150,  // ₹150/week
  driver: 180,    // ₹180/week
  other: 120,     // ₹120/week
  'Swiggy': 160,  // ₹160/week
  'Uber': 180,    // ₹180/week
  'Zomato': 160,  // ₹160/week
  'Ola': 180,     // ₹180/week
  'Rapido': 160   // ₹160/week
};

// Risk multipliers based on location safety
const LOCATION_RISK_PROFILE = {
  'Whitefield': { safeFromWaterlogging: true, riskMultiplier: 0.85 }, // 15% discount
  'Bangalore North': { safeFromWaterlogging: false, riskMultiplier: 1.15 },
  'Bangalore South': { safeFromWaterlogging: true, riskMultiplier: 0.90 },
  'ORR': { safeFromWaterlogging: false, riskMultiplier: 1.10 },
  'Sarjapur': { safeFromWaterlogging: false, riskMultiplier: 1.20 }
};

/**
 * Calculate base premium with location adjustment
 */
exports.calculateBasePremium = (platform, location) => {
  let basePremium = BASE_PREMIUM[platform] || BASE_PREMIUM.other;
  
  const locationProfile = LOCATION_RISK_PROFILE[location];
  if (locationProfile) {
    basePremium *= locationProfile.riskMultiplier;
  }

  return Math.round(basePremium);
};

/**
 * ML-based Premium Adjustment using historical data
 * Calls Python prediction model for dynamic pricing
 */
exports.getMLPredictedAdjustment = async (workerData) => {
  try {
    // In production, call Python ML model via REST API
    // For now, simulate with mock data
    
    const { dailyIncome, location, platform } = workerData;
    
    // Simulated ML prediction: Premium adjustment based on worker profile
    const incomeRiskScore = (dailyIncome / 500) * 100; // Normalize income
    const locationRisk = LOCATION_RISK_PROFILE[location]?.riskMultiplier || 1.0;
    
    // Calculate adjustment percentage (±20%)
    const mlAdjustment = (locationRisk - 1) * 100; // Convert to percentage
    
    // Map to Policy model enum values
    let riskLevel = 'MEDIUM';
    if (mlAdjustment < -10) riskLevel = 'LOW';
    if (mlAdjustment > 10) riskLevel = 'HIGH';
    
    return {
      riskScore: Math.round(incomeRiskScore),
      adjustmentPercentage: Math.round(mlAdjustment * 10) / 10,
      recommendation: riskLevel
    };
  } catch (err) {
    console.log("⚠️ ML Model Error → using defaults");
    return { riskScore: 50, adjustmentPercentage: 0, recommendation: 'MEDIUM' };
  }
};

/**
 * Calculate weather-based dynamic coverage hours
 * Predictive modeling: Increase coverage hours if bad weather forecasted
 */
exports.calculateDynamicCoverageHours = async (location) => {
  const baseCoverageHours = 12; // Default 12 hours/day coverage
  
  try {
    // Simulated: Check weather forecast
    const weatherForecast = {
      nextWeekRainChance: Math.random() * 100,
      avgAQI: 100 + Math.random() * 300
    };

    let coverageHours = baseCoverageHours;

    // Increased coverage if bad weather predicted
    if (weatherForecast.nextWeekRainChance > 60) {
      coverageHours = 14; // Extended coverage
    }
    
    if (weatherForecast.avgAQI > 200) {
      coverageHours = Math.min(coverageHours + 2, 16); // +2 hours for pollution
    }

    return {
      baseCoverageHours,
      predictedCoverageHours: coverageHours,
      adjustmentReason: coverageHours > baseCoverageHours ? 'Bad weather forecast detected' : 'Normal conditions'
    };
  } catch (err) {
    return {
      baseCoverageHours,
      predictedCoverageHours: baseCoverageHours,
      adjustmentReason: 'Standard coverage'
    };
  }
};

/**
 * Calculate final premium with all factors
 * Returns: Premium amount and breakdown
 */
exports.calculateFinalPremium = async (workerData) => {
  const { platform, location, dailyIncome } = workerData;

  // Step 1: Base premium with location adjustment
  const basePremium = exports.calculateBasePremium(platform, location);

  // Step 2: ML-based adjustment
  const mlAdjustment = await exports.getMLPredictedAdjustment(workerData);

  // Step 3: Dynamic coverage hours
  const coverageData = await exports.calculateDynamicCoverageHours(location);

  // Step 4: Calculate final premium
  const adjustedPremium = Math.round(basePremium * (1 + mlAdjustment.adjustmentPercentage / 100));

  return {
    basePremium,
    mlAdjustmentPercentage: mlAdjustment.adjustmentPercentage,
    finalWeeklyPremium: adjustedPremium,
    monthlyPremium: adjustedPremium * 4,
    quarterlyPremium: adjustedPremium * 13,
    riskProfile: mlAdjustment.recommendation,
    riskScore: mlAdjustment.riskScore,
    coverageHours: coverageData.predictedCoverageHours,
    breakdown: {
      basePremium,
      mlAdjustment: adjustedPremium - basePremium,
      location,
      platform,
      dailyIncomeEstimate: dailyIncome
    }
  };
};

/**
 * Get dynamic discount codes based on risk profile
 */
exports.getAvailableDiscounts = (location, platform) => {
  const discounts = [];

  const locationRisk = LOCATION_RISK_PROFILE[location];
  if (locationRisk && locationRisk.safeFromWaterlogging) {
    discounts.push({
      code: 'SAFE_ZONE_15',
      description: '₹15 discount - Operating in historically safe zone',
      discountAmount: 15,
      applicable: true
    });
  }

  if (platform === 'delivery') {
    discounts.push({
      code: 'DELIVERY_SAFE_10',
      description: '₹10 bonus discount for delivery partners',
      discountAmount: 10,
      applicable: true
    });
  }

  return discounts;
};
