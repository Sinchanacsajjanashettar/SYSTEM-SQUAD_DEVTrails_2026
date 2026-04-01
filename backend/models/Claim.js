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
  
  // Timestamps
  triggeredAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Claim", ClaimSchema);
