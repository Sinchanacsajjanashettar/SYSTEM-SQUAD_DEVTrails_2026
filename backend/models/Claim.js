const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
  
  // Claim Type & Amount
  claimType: { 
    type: String, 
    enum: ['HEAVY_RAINFALL', 'SEVERE_POLLUTION', 'EXTREME_HEAT', 'SEVERE_CONGESTION', 'CURFEW_LOCKDOWN'],
    required: true 
  },
  claimAmount: { type: Number, required: true },
  
  // Claim Status
  status: { 
    type: String, 
    enum: ['triggered', 'approved', 'rejected', 'paid', 'pending_review'],
    default: 'triggered'
  },
  
  // Auto-Trigger Data
  triggerData: {
    rainfall: Number,
    aqi: Number,
    temperature: Number,
    congestionIndex: Number,
    curfewActive: Boolean,
    timestamp: { type: Date, default: Date.now }
  },
  
  // Payout Details
  payoutMethod: { 
    type: String, 
    enum: ['upi', 'bank_transfer', 'wallet'],
    default: 'upi'
  },
  payoutUPI: String,
  payoutStatus: { 
    type: String, 
    enum: ['pending', 'initiated', 'success', 'failed'],
    default: 'pending'
  },
  paidAt: Date,
  transactionId: String,
  
  // Evidence & Documentation
  autoApprovalReason: {
    type: String,
    default: 'Parametric trigger activated - zero-touch auto-approval'
  },
  reviewNotes: String,
  
  // Fraud Detection Score (0 = low risk, 1 = high risk)
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },

  // Fraud Risk Level
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },

  // Detailed Fraud Analysis from ML
  fraudDetails: {
    gps: {
      fraud_score: Number,
      risk_level: String,
      reason: [String],
      check: String
    },
    weather: {
      fraud_score: Number,
      risk_level: String,
      reason: [String],
      check: String
    },
    behavioral: {
      behavioral_score: Number,
      risk_level: String,
      reason: [String],
      check: String
    }
  },
  
  // Trigger activation timestamp
  triggeredAt: { type: Date, default: Date.now }
}, { timestamps: true });  // Automatically adds createdAt and updatedAt

module.exports = mongoose.model("Claim", ClaimSchema);
