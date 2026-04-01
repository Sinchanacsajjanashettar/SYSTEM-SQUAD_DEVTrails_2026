const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  
  // Premium Details
  weeklyPremium: { type: Number, required: true },
  monthlyPremium: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  
  // Coverage Details
  coverageStartDate: { type: Date, required: true },
  coverageEndDate: { type: Date, required: true },
  coverageHours: { type: Number, default: 12 }, // Hours per day
  maxCoverageAmount: { type: Number, default: 5000 }, // Max claim per incident
  
  // Policy Status
  active: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'pending', 'expired', 'cancelled'], default: 'active' },
  renewalDate: { type: Date },
  
  // Risk & Pricing
  riskProfile: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  riskScore: { type: Number, default: 50 },
  appliedDiscounts: [{ code: String, amount: Number }],
  
  // Triggers Enabled
  enabledTriggers: {
    rainfall: { type: Boolean, default: true },
    aqi: { type: Boolean, default: true },
    heat: { type: Boolean, default: true },
    traffic: { type: Boolean, default: true },
    curfew: { type: Boolean, default: true }
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Policy", PolicySchema);
