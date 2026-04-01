const Policy = require("../models/Policy");
const Worker = require("../models/Worker");
const { 
  calculateFinalPremium, 
  getAvailableDiscounts,
  calculateDynamicCoverageHours 
} = require("../services/premiumCalculationService");

/**
 * Create Policy with Dynamic Premium Calculation
 * Integrates ML-based risk assessment
 */
exports.createPolicy = async (req, res) => {
  try {
    const { workerId, coveragePeriod = 'weekly', applyDiscountCode } = req.body;

    // Verify worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Check if worker already has an active policy
    const existingPolicy = await Policy.findOne({
      workerId,
      active: true,
      coverageEndDate: { $gte: new Date() }
    });

    if (existingPolicy) {
      return res.status(400).json({ 
        message: "Worker already has an active policy",
        existingPolicy
      });
    }

    // Calculate premium using ML model
    const premiumData = await calculateFinalPremium({
      platform: worker.platform,
      location: worker.location,
      dailyIncome: worker.dailyIncome
    });

    // Get available discounts
    const availableDiscounts = getAvailableDiscounts(worker.location, worker.platform);

    // Apply discount if provided
    let finalWeeklyPremium = premiumData.finalWeeklyPremium;
    const appliedDiscounts = [];

    if (applyDiscountCode) {
      const discount = availableDiscounts.find(d => d.code === applyDiscountCode);
      if (discount) {
        finalWeeklyPremium = Math.max(0, finalWeeklyPremium - discount.discountAmount);
        appliedDiscounts.push({
          code: discount.code,
          amount: discount.discountAmount
        });
      }
    }

    // Set coverage dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (coveragePeriod === 'weekly' ? 7 : 30));

    // Create policy
    const policy = new Policy({
      workerId,
      weeklyPremium: finalWeeklyPremium,
      monthlyPremium: finalWeeklyPremium * 4,
      coverageStartDate: startDate,
      coverageEndDate: endDate,
      coverageHours: premiumData.coverageHours,
      maxCoverageAmount: 5000,
      riskProfile: premiumData.riskProfile,
      riskScore: premiumData.riskScore,
      appliedDiscounts: appliedDiscounts,
      active: true,
      status: 'active'
    });

    await policy.save();

    // Update worker's risk score
    worker.riskScore = premiumData.riskScore;
    await worker.save();

    res.status(201).json({
      message: "Policy created successfully",
      policy,
      premiumBreakdown: premiumData.breakdown,
      availableDiscounts: availableDiscounts.filter(d => !applyDiscountCode || d.code !== applyDiscountCode)
    });
  } catch (error) {
    console.error("Policy creation error:", error);
    res.status(500).json({ message: "Policy creation failed", error: error.message });
  }
};

/**
 * Calculate Premium (Live Calculator for Frontend)
 * PHASE 2 FORMULA:
 * Premium = Base + Risk Adjustments based on Daily Income
 * 
 * Rainfall > 60mm → +10% of daily income
 * AQI > 350 → +15% of daily income
 * Heat > 45°C → +20% of daily income
 * Congestion > 8 → +5% of daily income
 * 
 * Final = Sum × 7 days - AI adjustments
 */
exports.calculatePremium = async (req, res) => {
  try {
    const { 
      platform, 
      location, 
      dailyIncome,
      rainfallThreshold,
      aqiThreshold, 
      heatThreshold,
      congestionThreshold 
    } = req.body;

    if (!platform || !location || !dailyIncome) {
      return res.status(400).json({ 
        message: "Missing required fields: platform, location, dailyIncome",
        finalWeeklyPremium: 0
      });
    }

    const dailyIncomeNum = parseInt(dailyIncome);

    // ⭐ PHASE 2 FORMULA: Calculate premium based on percentage additions
    let premiumPercentage = 0;
    const breakdown = {};

    // Rainfall risk: if ACTUAL rainfall EXCEEDS 60mm, it's high risk
    if (rainfallThreshold !== undefined && rainfallThreshold !== null) {
      if (rainfallThreshold > 60) {
        premiumPercentage += 10; // +10% if rainfall EXCEEDS 60mm
        breakdown.rainfall = `+10% (rainfall ${rainfallThreshold}mm > 60mm target)`;
        console.log("  🌧️  Rainfall Risk: +10% (EXCEEDS 60mm)");
      }
    }

    // AQI risk: if ACTUAL AQI EXCEEDS 350, it's high risk
    if (aqiThreshold !== undefined && aqiThreshold !== null) {
      if (aqiThreshold > 350) {
        premiumPercentage += 15; // +15% if AQI EXCEEDS 350
        breakdown.aqi = `+15% (AQI ${aqiThreshold} > 350 target)`;
        console.log("  💨 AQI Risk: +15% (EXCEEDS 350)");
      }
    }

    // Heat risk: if ACTUAL temperature EXCEEDS 45°C, it's high risk
    if (heatThreshold !== undefined && heatThreshold !== null) {
      if (heatThreshold > 45) {
        premiumPercentage += 20; // +20% if heat EXCEEDS 45°C
        breakdown.heat = `+20% (temperature ${heatThreshold}°C > 45°C target)`;
        console.log("  🔥 Heat Risk: +20% (EXCEEDS 45°C)");
      }
    }

    // Congestion risk: if ACTUAL congestion EXCEEDS 8, it's high risk
    if (congestionThreshold !== undefined && congestionThreshold !== null) {
      if (congestionThreshold > 8) {
        premiumPercentage += 5; // +5% if congestion EXCEEDS 8
        breakdown.traffic = `+5% (congestion ${congestionThreshold} > 8 target)`;
        console.log("  🚗 Traffic Risk: +5% (EXCEEDS 8)");
      }
    }

    // Calculate daily premium from percentage
    const dailyPremium = dailyIncomeNum * (premiumPercentage / 100);
    
    // Weekly premium = daily × 7 days
    let weeklyPremium = Math.round(dailyPremium * 7);

    // ⭐ AI ADJUSTMENTS:
    // Safe zone discount: -₹2
    let aiAdjustment = 0;
    const locationProfile = {
      // Safe Zones (low water logging risk) - ALL common Bangalore areas
      'Whitefield': { isSafe: true, discount: 2 },
      'Bangalore South': { isSafe: true, discount: 2 },
      'Koramangala': { isSafe: true, discount: 2 },
      'Kormangala': { isSafe: true, discount: 2 },
      'Indiranagar': { isSafe: true, discount: 2 },
      'Jayanagar': { isSafe: true, discount: 2 },
      'Malleswaram': { isSafe: true, discount: 2 },
      'Banjara Hills': { isSafe: true, discount: 2 },
      'HSR Layout': { isSafe: true, discount: 2 },
      'BTM Layout': { isSafe: true, discount: 2 },
      'Bellandur': { isSafe: true, discount: 2 },
      'Sarjapur': { isSafe: true, discount: 2 },
      'Marathahalli': { isSafe: true, discount: 2 },
      'Yeshwanthpur': { isSafe: true, discount: 2 },
      'Vijayanagar': { isSafe: true, discount: 2 },
      'Ashok Nagar': { isSafe: true, discount: 2 },
      'Shivajinagar': { isSafe: true, discount: 2 },
      'MG Road': { isSafe: true, discount: 2 },
      'Brigade Road': { isSafe: true, discount: 2 },
      'Cubbon Park': { isSafe: true, discount: 2 },
      'Ulsoor': { isSafe: true, discount: 2 },
      'Frazer Town': { isSafe: true, discount: 2 },
      'Sadashivanagar': { isSafe: true, discount: 2 },
      'Cantonment': { isSafe: true, discount: 2 },
      'Vijay Nagar': { isSafe: true, discount: 2 },
      'RMZ Eco Space': { isSafe: true, discount: 2 },
      'Domlur': { isSafe: true, discount: 2 },
      'Lavelle Road': { isSafe: true, discount: 2 },
      'Church Street': { isSafe: true, discount: 2 },
      'Residency Road': { isSafe: true, discount: 2 },
      // Risky Zones (high water logging risk)
      'Bangalore North': { isSafe: false, discount: 0 },
      'ORR': { isSafe: false, discount: 0 },
      'Outer Ring Road': { isSafe: false, discount: 0 },
      'Bannerghatta': { isSafe: false, discount: 0 },
      'Electronic City': { isSafe: false, discount: 0 }
    };

    // Case-insensitive location lookup (handles "Koramangala,Bangalore" format)
    console.log("🔍 Original location:", location);
    let normalizedLocation = location ? location.toLowerCase().trim() : '';
    console.log("🔍 After lowercase:", normalizedLocation);
    
    // Extract area name if location includes city (e.g., "koramangala,bangalore" → "koramangala")
    if (normalizedLocation.includes(',')) {
      normalizedLocation = normalizedLocation.split(',')[0].trim();
      console.log("🔍 After splitting:", normalizedLocation);
    }
    
    const locationDataKey = Object.keys(locationProfile).find(key => 
      key.toLowerCase() === normalizedLocation
    );
    console.log("🔍 Matched location key:", locationDataKey);
    
    const locationData = locationDataKey ? locationProfile[locationDataKey] : null;
    console.log("🔍 Location data:", locationData);
    
    if (locationData && locationData.isSafe) {
      aiAdjustment -= locationData.discount;
      breakdown.safeZoneDiscount = `-₹${locationData.discount} (safe zone)`;
      console.log(`  ✅ Safe Zone Adjustment: -₹${locationData.discount}`);
    } else {
      console.log(`  ⚠️  NOT a safe zone - no discount applied`);
    }

    // Final premium
    const finalWeeklyPremium = Math.max(100, weeklyPremium + aiAdjustment); // minimum ₹100

    // ⭐ AI FEATURE 2: PREDICTIVE WEATHER → DYNAMIC COVERAGE HOURS
    // Extend coverage hours if extreme weather predicted
    let baseCoverageHours = 8;
    let dynamicCoverageHours = 8;
    const weatherReasons = [];

    // If high rainfall predicted → extend coverage
    if (rainfallThreshold !== undefined && rainfallThreshold > 60) {
      dynamicCoverageHours = Math.min(dynamicCoverageHours + 2, 12);
      weatherReasons.push("🌧️ Heavy rainfall predicted - extended to protect during wet conditions");
    }

    // If high AQI predicted → extend coverage (air quality emergencies)
    if (aqiThreshold !== undefined && aqiThreshold > 350) {
      dynamicCoverageHours = Math.min(dynamicCoverageHours + 2, 14);
      weatherReasons.push("💨 Poor air quality predicted - extended coverage for health protection");
    }

    // If extreme heat predicted → extend coverage
    if (heatThreshold !== undefined && heatThreshold > 45) {
      dynamicCoverageHours = Math.min(dynamicCoverageHours + 3, 16);
      weatherReasons.push("🔥 Extreme heat predicted - extended coverage for heat stress protection");
    }

    console.log("✅ Coverage Hours:", {
      base: baseCoverageHours,
      dynamic: dynamicCoverageHours,
      reasons: weatherReasons
    });

    console.log("✅ Phase 2 Premium Calculated:", {
      dailyIncome: dailyIncomeNum,
      premiumPercentage: premiumPercentage + "%",
      dailyPremium: dailyPremium.toFixed(2),
      weeklyPremium,
      aiAdjustment,
      finalWeeklyPremium,
      thresholds: { rainfallThreshold, aqiThreshold, heatThreshold, congestionThreshold }
    });

    res.status(200).json({
      basePremium: weeklyPremium,
      finalWeeklyPremium: finalWeeklyPremium,
      monthlyPremium: finalWeeklyPremium * 4,
      premiumPercentage,
      aiAdjustment,
      safeZoneDiscount: locationData && locationData.isSafe ? locationData.discount : 0,
      riskProfile: premiumPercentage > 30 ? "HIGH" : premiumPercentage > 15 ? "MEDIUM" : "LOW",
      riskScore: premiumPercentage,
      coverageHours: {
        base: baseCoverageHours,
        dynamic: dynamicCoverageHours,
        extended: dynamicCoverageHours > baseCoverageHours,
        reasons: weatherReasons
      },
      breakdown: {
        dailyIncome: dailyIncomeNum,
        premiumPercentage: premiumPercentage + "%",
        dailyPremium: Math.round(dailyPremium),
        weeklyBasePremium: weeklyPremium,
        safeZoneDiscount: locationData && locationData.isSafe ? `-₹${locationData.discount}` : "₹0",
        aiAdjustment,
        finalWeeklyPremium,
        details: breakdown,
        aiFeatures: {
          dynamicPricing: "AI adjusts premium based on risk factors",
          safeZoneDiscount: locationData && locationData.isSafe ? `Applied ₹${locationData.discount} discount for safe zone` : "Not applicable",
          predictiveWeather: dynamicCoverageHours > baseCoverageHours ? `Coverage extended to ${dynamicCoverageHours} hours/day` : "Standard coverage"
        }
      }
    });
  } catch (error) {
    console.error("❌ Premium calculation error:", error);
    res.status(500).json({ 
      message: "Premium calculation failed",
      error: error.message,
      finalWeeklyPremium: 0
    });
  }
};

/**
 * Get Worker's Active Policy
 */
exports.getWorkerPolicy = async (req, res) => {
  try {
    const { workerId } = req.params;

    const policy = await Policy.findOne({
      workerId,
      active: true,
      coverageEndDate: { $gte: new Date() }
    }).populate('workerId', 'name platform location dailyIncome');

    if (!policy) {
      return res.status(404).json({ message: "No active policy found" });
    }

    res.status(200).json({
      policy,
      daysRemaining: Math.ceil((policy.coverageEndDate - new Date()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching policy", error: error.message });
  }
};

/**
 * Get All Policies (Admin)
 */
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await Policy.find()
      .populate('workerId', 'name platform location')
      .sort({ createdAt: -1 });

    const stats = {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.active && p.coverageEndDate > new Date()).length,
      totalCoverageAmount: policies.reduce((sum, p) => sum + p.maxCoverageAmount, 0),
      avgPremium: Math.round(policies.reduce((sum, p) => sum + p.weeklyPremium, 0) / policies.length)
    };

    res.status(200).json({
      policies,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching policies", error: error.message });
  }
};

/**
 * Renew Policy
 */
exports.renewPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    const worker = await Worker.findById(policy.workerId);

    // Recalculate premium
    const premiumData = await calculateFinalPremium({
      platform: worker.platform,
      location: worker.location,
      dailyIncome: worker.dailyIncome
    });

    // Update policy
    const newStartDate = policy.coverageEndDate;
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + 7);

    policy.weeklyPremium = premiumData.finalWeeklyPremium;
    policy.monthlyPremium = premiumData.finalWeeklyPremium * 4;
    policy.coverageStartDate = newStartDate;
    policy.coverageEndDate = newEndDate;
    policy.renewalDate = new Date();
    policy.riskScore = premiumData.riskScore;

    await policy.save();

    res.status(200).json({
      message: "Policy renewed successfully",
      policy,
      newPremium: premiumData.finalWeeklyPremium
    });
  } catch (error) {
    res.status(500).json({ message: "Policy renewal failed", error: error.message });
  }
};

/**
 * Cancel Policy
 */
exports.cancelPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { reason } = req.body;

    const policy = await Policy.findByIdAndUpdate(
      policyId,
      {
        active: false,
        status: 'cancelled',
        coverageEndDate: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      message: "Policy cancelled successfully",
      policy
    });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling policy", error: error.message });
  }
};

/**
 * Get Available Discounts for a Worker
 */
exports.getAvailableDiscountsEndpoint = async (req, res) => {
  try {
    const { workerId } = req.params;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const discounts = getAvailableDiscounts(worker.location, worker.platform);

    res.status(200).json({
      worker: {
        name: worker.name,
        location: worker.location,
        platform: worker.platform
      },
      availableDiscounts: discounts
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching discounts", error: error.message });
  }
};
