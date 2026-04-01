import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity, CloudRain, Wind, AlertCircle, TrendingUp, ShieldCheck, Zap, Thermometer, Gauge } from 'lucide-react';

const Dashboard = () => {
  const [workerName, setWorkerName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [envData, setEnvData] = useState({ rain: 45, aqi: 180, temp: 32, congestion: 3, status: 'Normal' });
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({ totalClaims: 0, approvedClaims: 0, totalAmountPaid: 0 });

  useEffect(() => {
    const name = localStorage.getItem('workerName') || 'Partner';
    const id = localStorage.getItem('workerId');
    setWorkerName(name);
    setWorkerId(id);
    
    // ✅ Fetch claims from backend with correct endpoint
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

  // Redirect to register if not logged in
  if (!localStorage.getItem('workerId')) {
    return <Navigate to="/register" />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome back, {workerName}! 👋</h1>
          <p className="text-gray-600 text-lg">Your AI-powered insurance protection dashboard</p>
        </div>
        <Link to="/policy" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition shadow-md flex items-center gap-2">
          <ShieldCheck size={20} /> Manage Policy
        </Link>
      </div>

      {/* Real-time Status Grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Protection Insights */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="text-green-500" size={24}/> Protection Insights</h3>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                "GigShield AI monitors your work zone 24/7. If any trigger is activated, claims are auto-approved instantly with zero paperwork."
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

        {/* Active Triggers Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Zap className="text-yellow-400" size={24}/> Active Triggers (5)</h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <span className="text-xl">🌧️</span>
                Heavy Rainfall
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-300">
                &gt; 60mm
              </span>
            </li>
            <li className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <span className="text-xl">💨</span>
                Severe Pollution
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/30 text-orange-300">
                &gt; 350 AQI
              </span>
            </li>
            <li className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <span className="text-xl">🔥</span>
                Extreme Heat
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/30 text-red-300">
                &gt; 45°C
              </span>
            </li>
            <li className="flex justify-between items-center border-b border-gray-700 pb-3">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <span className="text-xl">🚗</span>
                Traffic Congestion
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/30 text-yellow-300">
                &gt; 8/10
              </span>
            </li>
            <li className="flex justify-between items-center pb-3">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <span className="text-xl">⛔</span>
                Govt. Curfew
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-300">
                Active
              </span>
            </li>
          </ul>
          <p className="mt-6 text-xs text-gray-400">
            💡 All 5 triggers monitored 24/7. Instant payouts to your UPI when threshold is met.
          </p>
        </div>
      </div>
      {/* Claim History Section */}
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
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

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
        <p className="text-blue-900 font-semibold">
          ✨ <span className="font-bold">Zero-Touch Claims:</span> Your insurance claims are automatically approved and processed the moment any trigger condition is met.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;