const mongoose = require("mongoose");

// Define the Schema with enhanced fields for Phase 2
const workerSchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, default: '9999999999' },
    password: { type: String, required: true },
    
    // Work Profile
    platform: { type: String, required: true, enum: ['delivery', 'driver', 'other', 'Swiggy', 'Uber', 'Zomato', 'Ola', 'Rapido'] },
    location: { type: String, required: true },
    dailyIncome: { type: Number, required: true },
    workingHours: { type: Number, default: 12 }, // Hours per day
    
    // Banking Details (for zero-touch claims)
    upiHandle: { type: String }, // UPI for instant payouts
    bankAccount: { type: String },
    ifscCode: { type: String },
    accountHolder: { type: String },
    
    // Insurance Status
    riskScore: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
    registeredAt: { type: Date, default: Date.now },
    
    // Emergency Contact
    emergencyContact: { type: String },
    relationshipToWorker: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Worker", workerSchema);
