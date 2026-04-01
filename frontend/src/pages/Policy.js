import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Umbrella, Wind, CloudRain, Zap, AlertCircle } from 'lucide-react';




const Policy = () => {
  const [workerData, setWorkerData] = useState(null);
  const [riskParams, setRiskParams] = useState({
    rainfallThreshold: 60,
    aqiThreshold: 350,
    heatThreshold: 45,
    congestionThreshold: 8
  });
  const [coveragePeriod, setCoveragePeriod] = useState('weekly');
  const [policy, setPolicy] = useState(null);
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const workerId = localStorage.getItem('workerId');
    const workerName = localStorage.getItem('workerName');
    const dailyIncome = localStorage.getItem('dailyIncome');
    const location = localStorage.getItem('location');
    const platform = localStorage.getItem('platform');
    
    if (workerId) {
      const data = { workerId, workerName, dailyIncome, location, platform };
      setWorkerData(data);
      // Calculate premium after setting worker data
      calculatePremiumForWorker(data);
    } else {
      setError("Please register first to create a policy");
    }
  }, []);

  // Redirect if not logged in
  if (!localStorage.getItem('workerId')) {
    window.location.href = '/register';
    return null;
  }

  const calculatePremiumForWorker = async (worker) => {
    try {
      const response = await axios.post("http://localhost:5000/api/policy/calculate", {
        platform: worker.platform,
        location: worker.location,
        dailyIncome: worker.dailyIncome
      });
      console.log("✅ Initial Premium calculated:", response.data);
      setPremium(response.data.finalWeeklyPremium);
    } catch (err) {
      console.error("❌ Error calculating initial premium:", err);
    }
  };

  const calculatePremium = async (updatedParams) => {
  if (!workerData) return;
  try {
    // Send the parameters directly
    const payloadData = {
      platform: workerData.platform,
      location: workerData.location,
      dailyIncome: workerData.dailyIncome,
      rainfallThreshold: updatedParams?.rainfallThreshold !== undefined ? updatedParams.rainfallThreshold : riskParams.rainfallThreshold,
      aqiThreshold: updatedParams?.aqiThreshold !== undefined ? updatedParams.aqiThreshold : riskParams.aqiThreshold,
      heatThreshold: updatedParams?.heatThreshold !== undefined ? updatedParams.heatThreshold : riskParams.heatThreshold,
      congestionThreshold: updatedParams?.congestionThreshold !== undefined ? updatedParams.congestionThreshold : riskParams.congestionThreshold
    };
    
    console.log("📤 Sending premium calculation:", payloadData);
    
    const response = await axios.post("http://localhost:5000/api/policy/calculate", payloadData);
    console.log("✅ Premium response:", response.data);
    setPremium(response.data.finalWeeklyPremium);
  } catch (err) {
    console.error("❌ Premium calculation error:", err);
    setError("Error calculating premium: " + (err.response?.data?.message || err.message));
  }
};
  const handleSliderChange = (field, value) => {
    const updatedParams = { ...riskParams, [field]: Number(value) };
    setRiskParams(updatedParams);
    // ⭐ Call premium calculation immediately as slider moves
    calculatePremium(updatedParams);
  };

  const handleCreatePolicy = async () => {
    if (!workerData?.workerId) {
      setError("Worker ID not found. Please register first.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/policy/create', {
        workerId: workerData.workerId,
        coveragePeriod: coveragePeriod,
        riskParameters: riskParams
      });
      setPolicy(res.data);
    } catch (err) {
      console.error("Policy creation error:", err);
      setError(err.response?.data?.message || err.message || "Error generating policy");
    } finally {
      setLoading(false);
    }
  };

  


  if (error && !workerData) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={24}/>
          <div>
            <p className="font-bold text-red-900">Access Denied</p>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">📋 Create Insurance Policy</h1>
        <p className="text-gray-600 text-lg">Set your risk parameters and calculate AI-powered premium</p>
      </div>
      {/* Live Premium Display */}
    <div className="bg-gradient-to-r from-blue-600 to-green-600 p-8 rounded-2xl shadow-lg text-white">
      <p className="text-lg font-semibold text-blue-100 mb-2">💰 Dynamic Weekly Premium</p>
      <h2 className="text-5xl font-bold">
        {premium ? `₹${premium}` : "Calculating..."}
      </h2>
      <p className="text-sm text-blue-100 mt-2">📊 Auto-adjusts based on risk thresholds • Powered by ML</p>
    </div>


      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg text-red-900">
          ❌ {error}
        </div>
      )}

      {!policy ? (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column: Risk Parameters */}
          <div className="md:col-span-2 space-y-6">
            {/* Worker Info */}
            {workerData && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Wind className="text-blue-500"/> Worker Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">NAME</p>
                    <p className="text-lg font-bold text-gray-800">{workerData.workerName}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">WORKER ID</p>
                    <p className="text-sm font-mono text-gray-800 truncate">{workerData.workerId}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">PLATFORM</p>
                    <p className="text-lg font-bold text-gray-800">{workerData.platform}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">LOCATION</p>
                    <p className="text-lg font-bold text-gray-800">{workerData.location}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg md:col-span-2">
                    <p className="text-xs text-gray-600 font-semibold">DAILY INCOME</p>
                    <p className="text-lg font-bold text-green-700">₹{workerData.dailyIncome}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Parameters */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="text-orange-500"/> Risk Parameters & Thresholds
              </h3>
              
              <div className="space-y-6">
                {/* Rainfall Threshold */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <CloudRain className="text-blue-500" size={18}/>
                    Rainfall Threshold
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="30"
                      max="150"
                      value={riskParams.rainfallThreshold}
                      onChange={(e) => handleSliderChange('rainfallThreshold', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={riskParams.rainfallThreshold}
                      onChange={(e) => handleSliderChange('rainfallThreshold', parseInt(e.target.value))}
                      className="w-20 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                    <span className="text-sm text-gray-600 font-semibold">mm</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Claim triggered if rainfall exceeds this threshold</p>
                </div>

                {/* AQI Threshold */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Wind className="text-orange-500" size={18}/>
                    AQI (Air Quality Index) Threshold
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="200"
                      max="500"
                      value={riskParams.aqiThreshold}
                      onChange={(e) => handleSliderChange('aqiThreshold', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={riskParams.aqiThreshold}
                      onChange={(e) => handleSliderChange('aqiThreshold', parseInt(e.target.value))}
                      className="w-20 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                    <span className="text-sm text-gray-600 font-semibold">AQI</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Claim triggered if air quality exceeds this threshold</p>
                </div>

                {/* Heat Threshold */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    🔥 Heat Threshold
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="35"
                      max="50"
                      value={riskParams.heatThreshold}
                      onChange={(e) => handleSliderChange('heatThreshold', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={riskParams.heatThreshold}
                      onChange={(e) => handleSliderChange('heatThreshold', parseInt(e.target.value))}
                      className="w-20 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                    <span className="text-sm text-gray-600 font-semibold">°C</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Claim triggered if temperature exceeds this threshold</p>
                </div>

                {/* Congestion Threshold */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    🚗 Traffic Congestion Threshold
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="10"
                      step="0.5"
                      value={riskParams.congestionThreshold}
                      onChange={(e) => handleSliderChange('congestionThreshold', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={riskParams.congestionThreshold}
                      onChange={(e) => handleSliderChange('congestionThreshold', parseFloat(e.target.value))}
                      className="w-20 p-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                    <span className="text-sm text-gray-600 font-semibold">/10</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Claim triggered if congestion exceeds this level</p>
                </div>

                {/* Coverage Period */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Coverage Period</label>
                  <select
                    value={coveragePeriod}
                    onChange={(e) => setCoveragePeriod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly (7 days)</option>
                    <option value="monthly">Monthly (30 days)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreatePolicy}
                disabled={loading || !workerData}
                className={`w-full mt-8 py-4 rounded-xl font-bold text-white text-lg transition ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl'
                }`}
              >
                {loading ? '⏳ Calculating AI Premium...' : '✨ Calculate & Create Policy'}
              </button>
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg">
              <h4 className="text-lg font-bold mb-4">🛡️ How It Works</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Set your risk thresholds above</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>AI calculates your premium based on location & platform</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>24/7 monitoring detects when thresholds are exceeded</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Claims auto-approved instantly (zero-touch)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  <span>Payout to your UPI within minutes</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">
              <p className="text-green-900 text-sm font-semibold mb-2">💡 Pro Tip:</p>
              <p className="text-green-800 text-sm">Lower thresholds = More frequent claims but higher premium. Adjust based on your work patterns!</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-lg">
              <p className="text-yellow-900 text-sm font-semibold mb-2">📊 Defaults Used:</p>
              <ul className="text-yellow-800 text-xs space-y-1">
                <li>• Rainfall: 60mm (heavy rainfall)</li>
                <li>• AQI: 350 (severe pollution)</li>
                <li>• Heat: 45°C (extreme heat)</li>
                <li>• Congestion: 8/10 (severe traffic)</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-green-900">✅ Policy Created Successfully!</h3>
            <p className="text-green-800 mt-2">Your insurance is now active. Monitoring 24/7 for trigger events.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200">
              <p className="text-xs font-bold text-gray-600 mb-2">WEEKLY PREMIUM</p>
              <p className="text-3xl font-bold text-blue-600">₹{Math.round(policy.policy.weeklyPremium)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200">
              <p className="text-xs font-bold text-gray-600 mb-2">MONTHLY PREMIUM</p>
              <p className="text-3xl font-bold text-blue-600">₹{Math.round(policy.policy.monthlyPremium)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200">
              <p className="text-xs font-bold text-gray-600 mb-2">COVERAGE HOURS/DAY</p>
              <p className="text-3xl font-bold text-blue-600">{policy.policy.coverageHours}h</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="text-xl font-bold mb-4">📊 Premium Breakdown</h4>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span>Base Premium ({policy.policy.platform}):</span>
                <span className="font-bold">₹{Math.round(policy.premiumBreakdown.basePremium)}</span>
              </div>
              <div className="flex justify-between">
                <span>Location Adjustment ({policy.premiumBreakdown.location}):</span>
                <span className="font-bold">₹{Math.round(policy.premiumBreakdown.mlAdjustment)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-blue-600">
                <span>Final Weekly Premium:</span>
                <span>₹{Math.round(policy.policy.weeklyPremium)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setPolicy(null); setError(''); }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition"
          >
            ← Create Another Policy
          </button>
        </div>
      )}
    </div>
  );
};

export default Policy;