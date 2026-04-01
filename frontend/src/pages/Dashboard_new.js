import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CloudRain, Wind, AlertCircle, TrendingUp, ShieldCheck, Zap, Thermometer, Gauge, PlayCircle } from 'lucide-react';

const Dashboard = () => {
  const [workerName, setWorkerName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [envData, setEnvData] = useState({ rain: 45, aqi: 180, temp: 32, congestion: 3, status: 'Normal' });
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({ totalClaims: 0, approvedClaims: 0, totalAmountPaid: 0 });
  const [simulatingClaim, setSimulatingClaim] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('workerName') || 'Partner';
    const id = localStorage.getItem('workerId');
    setWorkerName(name);
    setWorkerId(id);

    // Fetch real claims from backend
    if (id) {
      fetch(`http://localhost:5000/api/claims/history/${id}`)
        .then(res => res.json())
        .then(data => {
          setClaims(data.claims || []);
          setStats(data.statistics || {});
        })
        .catch(err => console.log("Error fetching claims:", err));
    }

    // Simulate live environmental data every 5 seconds
    const interval = setInterval(() => {
      setEnvData({
        rain: Math.round(Math.random() * 100),
        aqi: Math.round(50 + Math.random() * 350),
        temp: 20 + Math.round(Math.random() * 25),
        congestion: Math.round(Math.random() * 10),
        status: Math.random() > 0.7 ? 'Alert' : 'Monitoring'
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulate a claim trigger for demo
  const simulateClaimTrigger = async (triggerType) => {
    if (!workerId) {
      setClaimMessage('❌ Worker ID not found');
      return;
    }

    setSimulatingClaim(true);
    const triggerData = {
      'HEAVY_RAINFALL': { trigger: 'HEAVY_RAINFALL', value: 75, claimAmount: 300, coverage: 'Income Loss during Heavy Rain' },
      'SEVERE_POLLUTION': { trigger: 'SEVERE_POLLUTION', value: 380, claimAmount: 250, coverage: 'Income Loss due to Air Pollution' },
      'EXTREME_HEAT': { trigger: 'EXTREME_HEAT', value: 48, claimAmount: 200, coverage: 'Income Loss during Extreme Heat' },
      'SEVERE_CONGESTION': { trigger: 'SEVERE_CONGESTION', value: 9, claimAmount: 150, coverage: 'Income Loss due to Traffic' }
    };

    try {
      const response = await fetch('http://localhost:5000/api/claims/auto-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          triggerData: triggerData[triggerType]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClaimMessage(`✅ Claim Approved. Funds transferred to your UPI.`);
        // Refresh claims
        setTimeout(() => {
          fetch(`http://localhost:5000/api/claims/history/${workerId}`)
            .then(res => res.json())
            .then(historyData => {
              setClaims(historyData.claims || []);
              setStats(historyData.statistics || {});
            });
        }, 500);
      } else {
        setClaimMessage(`❌ Claim failed: ${data.reason}`);
      }
    } catch (err) {
      setClaimMessage(`❌ Error: ${err.message}`);
    }

    setSimulatingClaim(false);
    setTimeout(() => setClaimMessage(''), 5000);
  };

  const triggers = [
    { name: 'Heavy Rainfall', threshold: '> 60mm', icon: '🌧️', current: envData.rain, status: envData.rain > 60 ? 'TRIGGERED' : 'Normal' },
    { name: 'Severe Pollution (AQI)', threshold: '> 350', icon: '💨', current: envData.aqi, status: envData.aqi > 350 ? 'TRIGGERED' : 'Normal' },
    { name: 'Extreme Heat', threshold: '> 45°C', icon: '🔥', current: envData.temp, status: envData.temp > 45 ? 'TRIGGERED' : 'Normal' },
    { name: 'Traffic Congestion', threshold: '> 8/10', icon: '🚗', current: envData.congestion, status: envData.congestion > 8 ? 'TRIGGERED' : 'Normal' },
    { name: 'Govt. Curfew', threshold: 'Active', icon: '⛔', current: 'Off', status: 'Normal' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome back, {workerName}! 👋</h1>
          <p className="text-gray-600 text-lg">Your AI-powered insurance protection dashboard</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/policy" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition shadow-md flex items-center gap-2">
            <ShieldCheck size={20} /> Manage Policy
          </Link>
        </div>
      </div>

      {/* Demo Claim Simulator (for testing) */}
      <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
          <PlayCircle className="text-purple-600" size={24}/>
          Test Claim Scenarios
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => simulateClaimTrigger('HEAVY_RAINFALL')}
            disabled={simulatingClaim}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50">
            🌧️ Rainfall
          </button>
          <button 
            onClick={() => simulateClaimTrigger('SEVERE_POLLUTION')}
            disabled={simulatingClaim}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50">
            💨 Pollution
          </button>
          <button 
            onClick={() => simulateClaimTrigger('EXTREME_HEAT')}
            disabled={simulatingClaim}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50">
            🔥 Heat
          </button>
          <button 
            onClick={() => simulateClaimTrigger('SEVERE_CONGESTION')}
            disabled={simulatingClaim}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50">
            🚗 Congestion
          </button>
        </div>
        {claimMessage && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${
            claimMessage.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {claimMessage}
          </div>
        )}
      </div>

      {/* Real-time Environmental Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><CloudRain size={24}/></div>
            <div>
              <p className="text-xs text-gray-500 font-bold">RAINFALL</p>
              <p className="text-2xl font-bold">{envData.rain.toFixed(0)}</p>
              <p className="text-xs text-gray-400">mm</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Wind size={24}/></div>
            <div>
              <p className="text-xs text-gray-500 font-bold">AQI</p>
              <p className="text-2xl font-bold">{envData.aqi.toFixed(0)}</p>
              <p className="text-xs text-gray-400">Quality Index</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg text-red-600"><Thermometer size={24}/></div>
            <div>
              <p className="text-xs text-gray-500 font-bold">TEMPERATURE</p>
              <p className="text-2xl font-bold">{envData.temp.toFixed(0)}°C</p>
              <p className="text-xs text-gray-400">Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600"><Gauge size={24}/></div>
            <div>
              <p className="text-xs text-gray-500 font-bold">CONGESTION</p>
              <p className="text-2xl font-bold">{envData.congestion.toFixed(1)}</p>
              <p className="text-xs text-gray-400">out of 10</p>
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-3 ${envData.status === 'Alert' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
          <div className={`${envData.status === 'Alert' ? 'bg-white text-red-600' : 'bg-white text-green-600'} p-2 rounded-lg`}>
            <Activity size={24}/>
          </div>
          <div>
            <p className="text-xs opacity-70 font-bold">SYSTEM STATUS</p>
            <p className={`text-2xl font-bold ${envData.status === 'Alert' ? 'text-red-600' : 'text-green-600'}`}>{envData.status}</p>
          </div>
        </div>
      </div>

      {/* Two-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earnings Impact & Protection Insights */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="text-green-500" size={24}/> Protection Insights</h3>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                "Based on current environmental patterns, GigShield AI is actively monitoring your work zone. Your protection is active 24/7. If any trigger condition is met, claims are auto-approved instantly."
              </p>
            </div>
            <div className="flex justify-around items-center py-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalClaims}</p>
                <p className="text-xs text-gray-400 font-medium">Total Claims</p>
              </div>
              <div className="w-[1px] h-10 bg-gray-200"></div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.approvedClaims}</p>
                <p className="text-xs text-gray-400 font-medium">Approved</p>
              </div>
              <div className="w-[1px] h-10 bg-gray-200"></div>
              <div>
                <p className="text-3xl font-bold text-blue-600">₹{stats.totalAmountPaid || 0}</p>
                <p className="text-xs text-gray-400 font-medium">Total Payout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Parametric Triggers */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Zap className="text-yellow-400" size={24}/> Active Triggers (5)</h3>
          <ul className="space-y-3">
            {triggers.map((trigger, idx) => (
              <li key={idx} className="flex justify-between items-center border-b border-gray-700 pb-3">
                <span className="text-gray-300 font-medium flex items-center gap-2">
                  <span className="text-xl">{trigger.icon}</span>
                  {trigger.name}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  trigger.status === 'TRIGGERED' ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'
                }`}>
                  {trigger.threshold}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-gray-400">
            💡 All 5 parametric triggers monitored 24/7. Once any threshold is exceeded, payouts are initiated automatically to your UPI handle.
          </p>
        </div>
      </div>

      {/* Recent Claims History */}
      {claims.length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><AlertCircle className="text-blue-600" size={24}/> Recent Claims</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Trigger Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Triggered At</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map((claim, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{claim.claimType}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">₹{claim.claimAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        claim.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(claim.triggeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
        <p className="text-blue-900 font-semibold">
          ✨ <span className="font-bold">Zero-Touch Claims:</span> Your insurance claims are automatically approved and processed the moment any trigger condition is met. No forms, no waiting – instant protection for your income.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
