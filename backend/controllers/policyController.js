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
