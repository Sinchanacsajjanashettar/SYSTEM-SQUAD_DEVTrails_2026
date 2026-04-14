const mongoose = require('mongoose');
const Worker = require('./models/Worker');
const Claim = require('./models/Claim');
const Policy = require('./models/Policy');
const fraudValidationService = require('./services/fraudValidationService');
const claimService = require('./services/claimService');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/gigshield', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function createTestClaim() {
  try {
    console.log('🔍 Creating test claim to verify ML integration...');

    // Create a test worker
    const testWorker = new Worker({
      name: 'Test Worker ML ' + Date.now(),
      email: 'testml' + Date.now() + '@example.com',
      phone: '9999999999',
      password: 'test123',
      platform: 'Swiggy',
      location: 'Bangalore',
      dailyIncome: 500,
      workingHours: 12,
      upiHandle: 'test@upi',
      riskScore: 30,
      isActive: true
    });

    await testWorker.save();
    console.log('✅ Created test worker:', testWorker._id);

    // Create a test policy
    const testPolicy = new Policy({
      workerId: testWorker._id,
      weeklyPremium: 50,
      monthlyPremium: 200,
      paidAmount: 200,
      active: true,
      status: 'active',
      coverageStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
      coverageEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Ends next year
      maxCoverageAmount: 10000,
      enabledTriggers: {
        rainfall: true,
        aqi: true,
        heat: true,
        traffic: true,
        curfew: true
      }
    });

    await testPolicy.save();
    console.log('✅ Created test policy');

    // Create a test claim with ML fraud detection
    const triggerData = {
      trigger: 'HEAVY_RAINFALL',
      claimAmount: 300,
      value: 75,
      coverage: 'Heavy Rainfall Coverage',
      location: 'Bangalore',
      latitude: 12.9716,
      longitude: 77.5946
    };

    console.log('🔍 Running ML fraud validation...');
    const fraudAssessment = await fraudValidationService.validateClaim({
      claimId: 'test-claim-' + Date.now(),
      claimType: triggerData.trigger,
      location: triggerData.location,
      workerId: testWorker._id.toString(),
      timestamp: new Date(),
      latitude: triggerData.latitude,
      longitude: triggerData.longitude,
      claimAmount: triggerData.claimAmount
    });

    console.log('📊 ML Fraud Assessment:', JSON.stringify(fraudAssessment, null, 2));

    // Create the claim
    const claim = new Claim({
      workerId: testWorker._id,
      policyId: testPolicy._id,
      claimType: triggerData.trigger,
      claimAmount: triggerData.claimAmount,
      status: 'approved',
      triggerData: {
        rainfall: triggerData.trigger === 'HEAVY_RAINFALL' ? triggerData.value : null,
        aqi: triggerData.trigger === 'SEVERE_POLLUTION' ? triggerData.value : null,
        temperature: triggerData.trigger === 'EXTREME_HEAT' ? triggerData.value : null,
        congestionIndex: triggerData.trigger === 'SEVERE_CONGESTION' ? triggerData.value : null,
        curfewActive: triggerData.trigger === 'CURFEW_LOCKDOWN' ? triggerData.value : false,
        timestamp: new Date()
      },
      payoutMethod: 'upi',
      payoutUPI: testWorker.upiHandle,
      payoutStatus: 'initiated',
      autoApprovalReason: `Parametric trigger activated: ${triggerData.coverage}`,
      fraudScore: fraudAssessment.fraudScore || 0.1,
      riskLevel: fraudAssessment.riskLevel || 'low',
      fraudDetails: fraudAssessment.details || {}
    });

    await claim.save();
    console.log('✅ Created test claim with ML fraud score:', claim.fraudScore);

    // Show the complete claim
    const savedClaim = await Claim.findById(claim._id).populate('workerId');
    console.log('📋 Complete claim data:', JSON.stringify(savedClaim, null, 2));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test claim:', error);
    process.exit(1);
  }
}

createTestClaim();