const mongoose = require('mongoose');
const Claim = require('./models/Claim');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/gigshield', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB');

  // Get latest 5 claims
  const claims = await Claim.find({})
    .sort({createdAt: -1})
    .limit(5)
    .select('claimType fraudScore riskLevel createdAt');

  console.log('\n📋 Latest 5 claims:');
  claims.forEach((c, i) => {
    console.log(`${i+1}. ${c.claimType} - Fraud Score: ${c.fraudScore}, Risk: ${c.riskLevel}, Created: ${c.createdAt}`);
  });

  // Get fraud statistics
  const totalClaims = await Claim.countDocuments();
  const lowRisk = await Claim.countDocuments({ fraudScore: { $lte: 0.4 } });
  const mediumRisk = await Claim.countDocuments({ fraudScore: { $gt: 0.4, $lte: 0.7 } });
  const highRisk = await Claim.countDocuments({ fraudScore: { $gt: 0.7 } });

  console.log('\n📊 Fraud Statistics:');
  console.log(`Total Claims: ${totalClaims}`);
  console.log(`Low Risk (≤0.4): ${lowRisk}`);
  console.log(`Medium Risk (0.4-0.7): ${mediumRisk}`);
  console.log(`High Risk (>0.7): ${highRisk}`);

  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});