/**
 * Backfill Script: Evaluate all existing claims with new ML fraud detection system
 * Retroactively applies ML models to claims created before full ML integration
 */

const mongoose = require('mongoose');
const Claim = require('./models/Claim');
const Worker = require('./models/Worker');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gigshield';
const PYTHON_API = 'http://localhost:5001';

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

/**
 * Evaluate a claim with ML fraud detection
 */
async function evaluateClaimWithML(claim) {
  try {
    const worker = await Worker.findById(claim.workerId);
    if (!worker) {
      console.warn(`⚠️ Worker not found for claim ${claim._id}`);
      return null;
    }

    // Call Python ML service for behavioral analysis
    console.log(`🔍 Evaluating claim ${claim.claimType} for worker ${worker.name}...`);

    // Get recent claims for this worker
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentClaims = await Claim.find({
      workerId: claim.workerId,
      createdAt: { $gte: thirtyDaysAgo },
      _id: { $ne: claim._id }  // Exclude current claim
    }).select('createdAt claimAmount').lean();

    const behavioralResponse = await axios.post(`${PYTHON_API}/api/fraud/check-behavioral`, {
      workerId: worker._id.toString(),
      claimAmount: claim.claimAmount,
      recentClaims: recentClaims.map(c => ({
        timestamp: c.createdAt?.toISOString() || new Date().toISOString(),
        claimAmount: c.claimAmount
      })),
      monthlyIncome: worker.estimatedMonthlyIncome || 21000
    }, { timeout: 10000 });

    // Get GPS analysis - extract coordinates from claim triggerData
    let currentLocation = 'Unknown';
    if (claim.triggerData && claim.triggerData.latitude && claim.triggerData.longitude) {
      currentLocation = {
        lat: claim.triggerData.latitude,
        lon: claim.triggerData.longitude
      };
    }

    const gpsResponse = await axios.post(`${PYTHON_API}/api/fraud/check-gps`, {
      workerId: worker._id.toString(),
      currentLocation: currentLocation,
      deliveryHistory: (worker.deliveryHistory || []).slice(-5)
    }, { timeout: 10000 }).catch(() => ({
      data: { fraud_score: 0, risk_level: 'low' }
    }));

    // Get weather analysis - use location from triggerData
    let location = 'Bangalore'; // Default
    if (claim.triggerData && claim.triggerData.location) {
      location = claim.triggerData.location;
    }

    const weatherResponse = await axios.post(`${PYTHON_API}/api/fraud/validate-weather`, {
      claimType: claim.claimType,
      location: location,
      timestamp: claim.createdAt
    }, { timeout: 10000 }).catch(() => ({
      data: { fraud_score: 0, is_valid: true }
    }));

    // Calculate composite score
    const weights = {
      gpsScore: 0.35,
      weatherScore: 0.40,
      behavioralScore: 0.25
    };

    const compositeScore = Math.min(1.0,
      (gpsResponse.data.fraud_score || 0) * weights.gpsScore +
      (weatherResponse.data.fraud_score || 0) * weights.weatherScore +
      (behavioralResponse.data.behavioral_score || 0) * weights.behavioralScore
    );

    // Determine risk level
    let riskLevel = 'low';
    if (compositeScore > 0.7) {
      riskLevel = 'high';
    } else if (compositeScore > 0.4) {
      riskLevel = 'medium';
    }

    return {
      fraudScore: compositeScore,
      riskLevel,
      fraudDetails: {
        gps: gpsResponse.data,
        weather: weatherResponse.data,
        behavioral: behavioralResponse.data
      }
    };

  } catch (error) {
    console.error(`❌ Error evaluating claim ${claim._id}:`, error.message);
    return null;
  }
}

/**
 * Main backfill process
 */
async function backfillFraudScores() {
  try {
    console.log('📊 Starting fraud score backfill...');
    await connectDB();

    // Get all claims without fraud scores or claims that still have default low risk with no ML details
    const claimsWithoutScores = await Claim.find({
      $or: [
        { fraudScore: { $exists: false } },
        { fraudScore: null },
        { riskLevel: { $exists: false } },
        { riskLevel: null },
        {
          fraudScore: 0,
          riskLevel: 'low',
          $or: [
            { 'fraudDetails.gps.fraud_score': { $exists: false } },
            { 'fraudDetails.weather.fraud_score': { $exists: false } },
            { 'fraudDetails.behavioral.behavioral_score': { $exists: false } }
          ]
        }
      ]
    }).populate('workerId', 'name upiHandle estimatedMonthlyIncome deliveryHistory').lean();

    console.log(`📋 Found ${claimsWithoutScores.length} claims without ML fraud scores`);

    let processed = 0;
    let successful = 0;

    for (const claim of claimsWithoutScores) {
      processed++;
      console.log(`\n🔄 Processing ${processed}/${claimsWithoutScores.length}: ${claim.claimType} - ₹${claim.claimAmount}`);

      // Add small delay to avoid overwhelming the API
      if (processed > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const assessment = await evaluateClaimWithML(claim);

      if (assessment) {
        // Update claim in database
        await Claim.updateOne(
          { _id: claim._id },
          {
            fraudScore: assessment.fraudScore,
            riskLevel: assessment.riskLevel,
            fraudDetails: assessment.fraudDetails
          }
        );

        console.log(`✅ Updated: Score=${(assessment.fraudScore * 100).toFixed(1)}%, Risk=${assessment.riskLevel}`);
        successful++;
      } else {
        console.log(`⏭️  Skipped: Could not evaluate`);
      }
    }

    console.log(`\n✨ Backfill complete: ${successful}/${processed} claims successfully evaluated`);

  } catch (error) {
    console.error('❌ Backfill error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

// Run backfill if executed directly
if (require.main === module) {
  backfillFraudScores();
}

module.exports = { evaluateClaimWithML, backfillFraudScores };
