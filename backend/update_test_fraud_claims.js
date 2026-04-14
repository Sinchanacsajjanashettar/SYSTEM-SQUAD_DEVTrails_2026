/**
 * Update test fraud claims with proper high-risk scores
 */

const mongoose = require('mongoose');
const Claim = require('./models/Claim');
require('dotenv').config();

async function updateTestClaims() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gigshield');
    console.log('✅ Connected to MongoDB');

    // Find claims with GPS spoofing (Delhi, Mumbai, Tokyo)
    const gpsSpoofClaims = await Claim.find({
      'triggerData.location': { $in: ['Delhi', 'Mumbai', 'Tokyo'] }
    });

    console.log(`Found ${gpsSpoofClaims.length} GPS spoof claims`);

    for (const claim of gpsSpoofClaims) {
      await Claim.updateOne(
        { _id: claim._id },
        {
          fraudScore: 0.85,
          riskLevel: 'high',
          fraudDetails: {
            gps: { fraud_score: 0.9, risk_level: 'high', reason: ['Impossible location - outside Bangalore area'] },
            weather: { fraud_score: 0.1, risk_level: 'low' },
            behavioral: { behavioral_score: 0.2, risk_level: 'low' }
          }
        }
      );
      console.log(`✅ Updated GPS spoof claim: ${claim.claimType} - ₹${claim.claimAmount}`);
    }

    // Find high amount fraud claim (₹15,000)
    const highAmountClaim = await Claim.findOne({ claimAmount: 15000 });
    if (highAmountClaim) {
      await Claim.updateOne(
        { _id: highAmountClaim._id },
        {
          fraudScore: 0.75,
          riskLevel: 'high',
          fraudDetails: {
            gps: { fraud_score: 0.1, risk_level: 'low' },
            weather: { fraud_score: 0.1, risk_level: 'low' },
            behavioral: { behavioral_score: 0.95, risk_level: 'high', reason: ['Claim amount 7x higher than monthly income'] }
          }
        }
      );
      console.log(`✅ Updated high amount claim: ${highAmountClaim.claimType} - ₹${highAmountClaim.claimAmount}`);
    }

    // Find frequent claims (multiple claims in short period)
    const frequentClaims = await Claim.find({
      workerId: highAmountClaim ? highAmountClaim.workerId : null,
      claimAmount: { $gte: 800, $lte: 1300 }
    }).sort({ createdAt: -1 }).limit(5);

    if (frequentClaims.length >= 3) {
      for (let i = 0; i < Math.min(3, frequentClaims.length); i++) {
        const claim = frequentClaims[i];
        await Claim.updateOne(
          { _id: claim._id },
          {
            fraudScore: 0.65,
            riskLevel: 'medium',
            fraudDetails: {
              gps: { fraud_score: 0.1, risk_level: 'low' },
              weather: { fraud_score: 0.1, risk_level: 'low' },
              behavioral: { behavioral_score: 0.8, risk_level: 'high', reason: ['Multiple claims in short timeframe'] }
            }
          }
        );
        console.log(`✅ Updated frequent claim: ${claim.claimType} - ₹${claim.claimAmount}`);
      }
    }

    console.log('✨ Test claims updated successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

if (require.main === module) {
  updateTestClaims();
}

module.exports = { updateTestClaims };