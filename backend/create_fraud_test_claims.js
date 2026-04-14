/**
 * Test script: Create test claims with fraud patterns to validate ML detection
 */

const mongoose = require('mongoose');
const Claim = require('./models/Claim');
const Worker = require('./models/Worker');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gigshield';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createFraudTestClaims() {
  try {
    console.log('🧪 Creating fraud test claims...');
    await connectDB();

    // Get a test worker
    let testWorker = await Worker.findOne({ name: 'fraud_test_worker' });
    if (!testWorker) {
      testWorker = new Worker({
        name: 'fraud_test_worker',
        email: 'fraudtest@test.com',
        phone: '9876543210',
        password: 'testpass123',
        platform: 'delivery',
        location: 'Bangalore',
        dailyIncome: 700, // ₹700/day ~ ₹21k/month
        upiHandle: 'fraudtest@upi',
        workingHours: 12
      });
      await testWorker.save();
      console.log('✅ Created test worker');
    }

    // Test Case 1: High Amount Fraud (claim amount too high for income)
    console.log('\n📝 Test 1: HIGH AMOUNT FRAUD');
    await Claim.create({
      workerId: testWorker._id,
      policyId: new mongoose.Types.ObjectId(),
      claimType: 'HEAVY_RAINFALL',
      claimAmount: 15000, // Very high for ₹21k monthly income
      status: 'triggered',
      triggerData: { rainfall: 150, timestamp: new Date() },
      payoutMethod: 'upi',
      payoutUPI: testWorker.upiHandle,
      fraudScore: undefined,
      riskLevel: undefined
    });
    console.log('✅ Created high amount fraud claim (₹15,000)');

    // Test Case 2: Frequent Claims (multiple claims in short period)
    console.log('\n📝 Test 2: FREQUENT CLAIMS FRAUD');
    for (let i = 0; i < 5; i++) {
      await Claim.create({
        workerId: testWorker._id,
        policyId: new mongoose.Types.ObjectId(),
        claimType: ['HEAVY_RAINFALL', 'SEVERE_POLLUTION', 'SEVERE_CONGESTION'][i % 3],
        claimAmount: 800 + (i * 100),
        status: 'triggered',
        triggerData: { timestamp: new Date(Date.now() - i * 3600000) }, // Every hour for last 5 hours
        payoutMethod: 'upi',
        payoutUPI: testWorker.upiHandle,
        fraudScore: undefined,
        riskLevel: undefined,
        createdAt: new Date(Date.now() - i * 3600000)
      });
    }
    console.log('✅ Created 5 frequent claims in 5 hours');

    // Test Case 3: GPS Spoofing (claims from impossible locations)
    console.log('\n📝 Test 3: GPS SPOOFING');
    const impossibleLocations = [
      { lat: 28.7041, lon: 77.1025, city: 'Delhi' },      // Delhi
      { lat: 19.0760, lon: 72.8777, city: 'Mumbai' },     // Mumbai
      { lat: 35.6762, lon: 139.6503, city: 'Tokyo' }      // Tokyo (literally impossible)
    ];

    for (const loc of impossibleLocations) {
      await Claim.create({
        workerId: testWorker._id,
        policyId: new mongoose.Types.ObjectId(),
        claimType: 'HEAVY_RAINFALL',
        claimAmount: 500,
        status: 'triggered',
        triggerData: { 
          rainfall: 100, 
          timestamp: new Date(),
          latitude: loc.lat,
          longitude: loc.lon,
          location: loc.city
        },
        payoutMethod: 'upi',
        payoutUPI: testWorker.upiHandle,
        fraudScore: undefined,
        riskLevel: undefined
      });
    }
    console.log('✅ Created 3 GPS spoofing claims (different locations)');

    // Test Case 4: Anomalous Timing (late night claims)
    console.log('\n📝 Test 4: ANOMALOUS TIMING');
    const lateNightDate = new Date();
    lateNightDate.setHours(3, 30, 0); // 3:30 AM

    for (let i = 0; i < 3; i++) {
      await Claim.create({
        workerId: testWorker._id,
        policyId: new mongoose.Types.ObjectId(),
        claimType: 'SEVERE_CONGESTION',
        claimAmount: 1000,
        status: 'triggered',
        triggerData: {
          congestionIndex: 95,
          timestamp: lateNightDate
        },
        payoutMethod: 'upi',
        payoutUPI: testWorker.upiHandle,
        fraudScore: undefined,
        riskLevel: undefined,
        createdAt: lateNightDate
      });
    }
    console.log('✅ Created 3 late-night claims');

    console.log('\n✨ Test fraud claims created! Now evaluating with ML...');
    
    // Wait a moment for database to sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get all unscored claims
    const unScoredClaims = await Claim.find({
      $or: [
        { fraudScore: { $exists: false } },
        { fraudScore: null }
      ]
    }).lean();

    console.log(`\n📊 Found ${unScoredClaims.length} claims to evaluate with ML`);

    // Make API call to evaluate one high-fraud claim
    console.log('\n🔍 Testing ML on high-amount fraud claim...');
    try {
      const response = await axios.post('http://localhost:5001/api/fraud/check-behavioral', {
        workerId: testWorker._id.toString(),
        claimAmount: 15000,
        recentClaims: [
          { timestamp: new Date().toISOString(), claimAmount: 800 },
          { timestamp: new Date(Date.now() - 3600000).toISOString(), claimAmount: 900 }
        ],
        monthlyIncome: 21000
      });

      console.log(`✅ Behavioral Score: ${(response.data.behavioral_score * 100).toFixed(1)}%`);
      console.log(`   Risk Level: ${response.data.risk_level}`);
      console.log(`   Reasons: ${response.data.reason.slice(0, 2).join(', ')}`);
    } catch (error) {
      console.error('❌ ML evaluation error:', error.message);
    }

    console.log('\n💡 Next step: Run backfill_fraud_scores.js to evaluate all test claims');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

if (require.main === module) {
  createFraudTestClaims();
}

module.exports = { createFraudTestClaims };
