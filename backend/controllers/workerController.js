const Worker = require("../models/Worker");
const { calculateFinalPremium, getAvailableDiscounts } = require("../services/premiumCalculationService");

/**
 * Worker Registration with Complete Onboarding
 * Includes: Basic info, platform, location, banking details
 */
exports.registerWorker = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone,
            platform, 
            location, 
            dailyIncome, 
            password,
            upiHandle,
            bankAccount,
            ifscCode,
            accountHolder,
            emergencyContact,
            relationshipToWorker
        } = req.body;

        // Validation
        if (!name || !email || !phone || !platform || !location || !dailyIncome || !password) {
            return res.status(400).json({ 
                message: "Missing required fields",
                requiredFields: ['name', 'email', 'phone', 'platform', 'location', 'dailyIncome', 'password']
            });
        }

        // Check if worker already exists
        const existingWorker = await Worker.findOne({ $or: [{ email }, { phone }] });
        if (existingWorker) {
            return res.status(400).json({ message: "Worker with this email or phone already exists" });
        }

        const newWorker = new Worker({
            name,
            email,
            phone,
            platform,
            location,
            dailyIncome,
            password,
            upiHandle,
            bankAccount,
            ifscCode,
            accountHolder,
            emergencyContact,
            relationshipToWorker,
            isActive: true,
            riskScore: 50 // Initial risk score
        });

        await newWorker.save();

        res.status(201).json({
            message: "Registration successful",
            worker: newWorker,
            nextStep: "Complete Policy Setup"
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

/**
 * Worker Login with Email and Password
 */
exports.loginWorker = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        
        const worker = await Worker.findOne({ email, password });
        if (!worker) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!worker.isActive) {
            return res.status(403).json({ message: "Account is inactive" });
        }

        res.status(200).json({
            message: "Login successful",
            worker
        });
    } catch (error) {
        res.status(500).json({ message: "Login error", error: error.message });
    }
};

/**
 * Get Worker by Phone Number (for login)
 */
exports.getWorkerByPhone = async (req, res) => {
    try {
        const { phone } = req.params;

        const worker = await Worker.findOne({ phone }).select('-password');
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.status(200).json({
            worker,
            profile: {
                name: worker.name,
                platform: worker.platform,
                location: worker.location,
                dailyIncome: worker.dailyIncome,
                riskScore: worker.riskScore,
                registeredSince: worker.registeredAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching worker", error: error.message });
    }
};

/**
 * Get Worker Profile with Risk Assessment
 */
exports.getWorkerProfile = async (req, res) => {
    try {
        const { workerId } = req.params;

        const worker = await Worker.findById(workerId).select('-password');
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.status(200).json({
            worker,
            profile: {
                name: worker.name,
                platform: worker.platform,
                location: worker.location,
                dailyIncome: worker.dailyIncome,
                riskScore: worker.riskScore,
                registeredSince: worker.registeredAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

/**
 * Update Worker Profile (including banking details)
 */
exports.updateWorkerProfile = async (req, res) => {
    try {
        const { workerId } = req.params;
        const updateData = req.body;

        // Prevent sensitive changes without verification
        if (updateData.password) {
            delete updateData.password; // Don't allow password update via this endpoint
        }

        const updatedWorker = await Worker.findByIdAndUpdate(
            workerId,
            updateData,
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: "Profile updated successfully",
            worker: updatedWorker
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};

/**
 * Get Worker's Risk Score
 */
exports.getWorkerRiskScore = async (req, res) => {
    try {
        const { workerId } = req.params;

        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.status(200).json({
            workerId: worker._id,
            name: worker.name,
            riskScore: worker.riskScore,
            location: worker.location,
            platform: worker.platform,
            riskCategory: worker.riskScore < 40 ? 'LOW' : worker.riskScore < 70 ? 'MEDIUM' : 'HIGH'
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching risk score", error: error.message });
    }
};

/**
 * Deactivate Worker Account
 */
exports.deactivateWorker = async (req, res) => {
    try {
        const { workerId } = req.params;

        const worker = await Worker.findByIdAndUpdate(
            workerId,
            { isActive: false },
            { new: true }
        );

        res.status(200).json({
            message: "Worker account deactivated",
            worker
        });
    } catch (error) {
        res.status(500).json({ message: "Error deactivating account", error: error.message });
    }
};