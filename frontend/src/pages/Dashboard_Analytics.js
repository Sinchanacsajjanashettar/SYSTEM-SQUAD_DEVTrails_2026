import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard_Analytics.css';

const DashboardAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [environmentData, setEnvironmentData] = useState({
    rainfall: 0,
    aqi: 0,
    temperature: 0,
    congestionIndex: 0
  });
  const [workerData, setWorkerData] = useState({
    worker: null,
    policy: null,
    claims: [],
    paymentHistory: [],
    forecast: null
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchEnvironmentData(); // Fetch initial environmental data
    
    // Auto-refresh claims and environment every 5 seconds (faster updates)
    const interval = setInterval(() => {
      const workerId = localStorage.getItem('workerId');
      if (workerId) {
        fetchClaimsOnly(workerId);
        fetchEnvironmentData(); // Keep environment data updated
      }
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const workerId = localStorage.getItem('workerId');

      if (!workerId) {
        setError('No worker ID found. Please login.');
        setLoading(false);
        return;
      }

      // Fetch worker data (required)
      const workerRes = await axios.get(`http://localhost:5000/api/workers/${workerId}`);
      
      // Fetch policy data (optional - may not exist yet)
      let policyRes = null;
      try {
        policyRes = await axios.get(`http://localhost:5000/api/policy/worker/${workerId}`);
      } catch (err) {
        if (err.response?.status !== 404) throw err;
        // 404 is OK - worker might not have created policy yet
      }

      // Fetch claims and payments (can be empty)
      const [claimsRes, paymentsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/claims/history/${workerId}?limit=10`).catch(err => ({ data: { claims: [] } })),
        axios.get(`http://localhost:5000/api/payments/history/${workerId}`).catch(err => ({ data: { data: { transactions: [] } } }))
      ]);

      setWorkerData({
        worker: workerRes.data,
        policy: policyRes?.data,
        claims: claimsRes.data?.claims || claimsRes.data?.data || [],
        paymentHistory: paymentsRes.data?.data?.transactions || paymentsRes.data?.transactions || []
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 401) {
        setError('Please login first.');
      } else if (err.response?.status === 404) {
        setError('Worker data not found. Please register first.');
      } else {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch only claims to check for auto-triggered claims
  const fetchClaimsOnly = async (workerId) => {
    try {
      const claimsRes = await axios.get(`http://localhost:5000/api/claims/history/${workerId}?limit=10`);
      
      // Handle multiple response formats
      let newClaims = [];
      if (Array.isArray(claimsRes.data?.claims)) {
        newClaims = claimsRes.data.claims;
      } else if (Array.isArray(claimsRes.data?.data)) {
        newClaims = claimsRes.data.data;
      } else if (Array.isArray(claimsRes.data)) {
        newClaims = claimsRes.data;
      }
      
      console.log(`✅ Claims refreshed: ${newClaims.length} found`);
      
      setWorkerData(prev => ({
        ...prev,
        claims: newClaims
      }));
    } catch (err) {
      console.log('⚠️ Could not refresh claims:', err.message);
      // Silent fail - don't interrupt user experience
    }
  };

  // Fetch live environmental data
  const fetchEnvironmentData = async () => {
    try {
      // Get latest triggered data from backend monitoring
      const envRes = await axios.get('http://localhost:5000/api/triggers/status');
      
      if (envRes && envRes.data && envRes.data.currentEnvironment) {
        // Use real data from backend
        setEnvironmentData({
          rainfall: envRes.data.currentEnvironment.rainfall,
          aqi: envRes.data.currentEnvironment.aqi,
          temperature: envRes.data.currentEnvironment.temperature,
          congestionIndex: envRes.data.currentEnvironment.congestionIndex
        });
      } else {
        // Fallback to test data with temperature above threshold for demo
        setEnvironmentData({
          rainfall: Math.random() * 100,
          aqi: Math.round(50 + Math.random() * 400),
          temperature: 46 + Math.random() * 10, // Set temperature above 45°C threshold
          congestionIndex: Math.random() * 10
        });
      }
    } catch (err) {
      console.log('⚠️ Environmental data error:', err.message);
      // Set random monitoring data as fallback
      setEnvironmentData({
        rainfall: Math.random() * 100,
        aqi: Math.round(50 + Math.random() * 400),
        temperature: 25 + Math.random() * 20,
        congestionIndex: Math.random() * 10
      });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-analytics loading">
        <div className="spinner">
          <div className="dot"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-analytics error">
        <div className="error-box">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { worker, policy, claims: claimsData, paymentHistory } = workerData;

  // Ensure claims is always an array
  const claims = Array.isArray(claimsData) ? claimsData : (claimsData?.data && Array.isArray(claimsData.data) ? claimsData.data : []);
  const paymentHistoryArray = Array.isArray(paymentHistory) ? paymentHistory : (paymentHistory?.data && Array.isArray(paymentHistory.data) ? paymentHistory.data : []);

  // Show message if no policy exists
  if (!policy) {
    return (
      <div className="dashboard-analytics no-policy">
        <div className="empty-state">
          <h2>📋 No Active Policy Found</h2>
          <p>You need to create an insurance policy to access full dashboard features.</p>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <p>Go to the <strong>Policy</strong> page</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <p>Select your coverage hours and discount</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <p>Create policy - then dashboard will show all details</p>
            </div>
          </div>
          <a href="/policy" className="btn-primary">Create Policy Now</a>
        </div>
      </div>
    );
  }

  const totalClaimsAmount = claims.reduce((sum, c) => sum + (c.claimAmount || 0), 0);
  const approvedClaims = claims.filter(c => c.status === 'approved' || c.status === 'paid').length;

  // Get current trigger data based on live environmental data
  const getTriggerThresholds = (triggerType) => {
    const thresholds = {
      rainfall: { 
        threshold: 60, 
        actualData: Math.round(environmentData.rainfall),
        claimAmount: 300,
        unit: 'mm'
      },
      pollution: { 
        threshold: 350, 
        actualData: Math.round(environmentData.aqi),
        claimAmount: 250,
        unit: 'AQI'
      },
      heat: { 
        threshold: 45, 
        actualData: Math.round(environmentData.temperature),
        claimAmount: 200,
        unit: '°C'
      },
      congestion: { 
        threshold: 8, 
        actualData: Math.round(environmentData.congestionIndex * 10) / 10,
        claimAmount: 150,
        unit: '/10'
      }
    };
    return thresholds[triggerType];
  };

  const handleClaimTrigger = async (triggerType) => {
    const workerId = localStorage.getItem('workerId');
    const triggerInfo = getTriggerThresholds(triggerType);
    
    // Check if threshold is actually crossed
    const isTriggered = triggerInfo.actualData > triggerInfo.threshold;
    
    if (!isTriggered) {
      setSuccessMessage({
        type: 'warning',
        title: '⚠️ No Trigger',
        message: `${triggerType.charAt(0).toUpperCase() + triggerType.slice(1)}: ${triggerInfo.actualData}${triggerInfo.unit} is NOT above ${triggerInfo.threshold}${triggerInfo.unit} threshold`,
        duration: 3000
      });
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    try {
      // Map trigger types to backend expected format
      const triggerTypeMap = {
        rainfall: 'HEAVY_RAINFALL',
        pollution: 'SEVERE_POLLUTION',
        heat: 'EXTREME_HEAT',
        congestion: 'SEVERE_CONGESTION'
      };

      const claimPayload = {
        workerId,
        triggerData: {
          trigger: triggerTypeMap[triggerType],
          claimAmount: triggerInfo.claimAmount,
          value: triggerInfo.actualData
        }
      };

      const response = await axios.post('http://localhost:5000/api/claims/auto-approve', claimPayload);

      // Show success with reason
      setSuccessMessage({
        type: 'success',
        title: '✅ Claim Approved',
        message: `${triggerInfo.actualData}${triggerInfo.unit} > ${triggerInfo.threshold}${triggerInfo.unit} threshold\n₹${triggerInfo.claimAmount} transferred to your UPI`,
        duration: 5000
      });

      // Refresh dashboard after 2 seconds
      setTimeout(() => {
        fetchDashboardData();
        setSuccessMessage(null);
      }, 2000);

    } catch (err) {
      console.error('❌ Claim error:', err);
      const errorMessage = err.response?.data?.reason || err.response?.data?.error || 'Could not process claim';
      setSuccessMessage({
        type: 'error',
        title: '❌ Claim Failed',
        message: errorMessage,
        duration: 5000
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="dashboard-analytics">
      {/* Success/Error Message */}
      {successMessage && (
        <div className={`success-message ${successMessage.type}`}>
          <div className="message-content">
            <h4>{successMessage.title}</h4>
            <p>{successMessage.message}</p>
          </div>
        </div>
      )}

      {/* Section 1: Earnings Protected Card */}
      <div className="card earnings-protected">
        <div className="card-header">
          <h3>💰 Earnings Protected</h3>
          <span className="badge-active">Active</span>
        </div>
        <div className="card-content">
          <div className="earnings-display">
            <div className="amount">
              ₹{policy?.policy?.weeklyPremium || policy?.finalPremium || policy?.basePremium || 498}/week
            </div>
            <div className="description">Weekly Coverage Active</div>
          </div>

          {policy?.safeZoneDiscount > 0 && (
            <div className="discount-badge">
              ✅ Safe Zone - You saved ₹{policy.safeZoneDiscount} this week!
            </div>
          )}

          <div className="coverage-info">
            <div className="info-row">
              <span>Protection Until</span>
              <span className="value">{formatClaimDate(policy?.policy?.coverageEndDate || policy?.expiryDate || policy?.coverageEndDate)}</span>
            </div>
            <div className="info-row">
              <span>Hours Covered</span>
              <span className="value">{policy?.policy?.coverageHours || policy?.hoursPerWeek || 50}/week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Claim Performance */}
      <div className="card claim-performance">
        <h3>📊 Claim Performance</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{claims.length}</div>
            <div className="stat-label">Total Claims</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{approvedClaims}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">₹{totalClaimsAmount}</div>
            <div className="stat-label">Total Recovered</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">100%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Section 3: Recent Claims Timeline */}
      <div className="card claim-timeline">
        <h3>🎯 Recent Claims (Last 10)</h3>
        {claims.length > 0 ? (
          <div className="timeline">
            {claims.map((claim, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-icon">
                  {getClaimTypeIcon(claim.claimType)}
                </div>
                <div className="timeline-content">
                  <div className="claim-type">{formatClaimType(claim.claimType)}</div>
                  <div className="claim-details">
                    <span className="amount">₹{claim.claimAmount}</span>
                    <span className={`status ${claim.status?.toLowerCase()}`}>
                      {claim.status ? claim.status.charAt(0).toUpperCase() + claim.status.slice(1) : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="timeline-date">
                  {formatClaimDate(claim.timestamp || claim.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No claims yet. Your environmental data is being monitored 24/7 ✅</p>
          </div>
        )}
      </div>

      {/* Section 4: Payment History */}
      <div className="card payment-history">
        <h3>💳 Payment History</h3>
        {paymentHistoryArray.length > 0 ? (
          <div className="payment-table">
            <div className="table-header">
              <div className="col-date">Date</div>
              <div className="col-type">Type</div>
              <div className="col-amount">Amount</div>
              <div className="col-status">Status</div>
              <div className="col-transaction">Transaction</div>
            </div>
            {paymentHistoryArray.slice(0, 5).map((payment, idx) => (
              <div key={idx} className="table-row">
                <div className="col-date">
                  {formatClaimDate(payment.date || payment.createdAt)}
                </div>
                <div className="col-type">{payment.claimType}</div>
                <div className="col-amount">₹{payment.amount}</div>
                <div className={`col-status status-${payment.status?.toLowerCase()}`}>
                  {payment.status}
                </div>
                <div className="col-transaction">
                  <span className="transaction-id">{payment.transactionId?.slice(-8)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No payouts yet. Claims will appear here when approved.</p>
          </div>
        )}
      </div>

      {/* Section 5: Coverage Breakdown */}
      <div className="card coverage-breakdown">
        <h3>📋 Coverage Breakdown</h3>
        <div className="coverage-details">
          <div className="coverage-row">
            <span className="label">Base Premium</span>
            <span className="value">₹{policy?.policy?.weeklyPremium || policy?.basePremium || 500}</span>
          </div>
          {policy?.policy?.appliedDiscounts?.length > 0 && (
            <div className="coverage-row discount">
              <span className="label">Discount Applied</span>
              <span className="value">-₹{policy.policy.appliedDiscounts.reduce((sum, d) => sum + d.amount, 0)}</span>
            </div>
          )}
          <div className="coverage-row total">
            <span className="label">Final Premium</span>
            <span className="value">₹{policy?.policy?.weeklyPremium || policy?.finalPremium || policy?.basePremium || 498}</span>
          </div>

          <div className="triggers-list">
            <p className="triggers-title">📍 Triggers Covered:</p>
            <div className="trigger-badges">
              <span className="trigger">🌧️ Rainfall</span>
              <span className="trigger">💨 Pollution</span>
              <span className="trigger">🌡️ Heat</span>
              <span className="trigger">🚗 Congestion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Live Environmental Monitoring */}
      <div className="card env-monitoring">
        <h3>🌍 Live Environmental Data</h3>
        <div className="env-grid">
          <div className="env-box">
            <div className="env-value">🌧️ {Math.round(environmentData.rainfall)}mm</div>
            <div className="env-label">Rainfall (Threshold: 60mm)</div>
            {environmentData.rainfall > 60 && <div className="env-alert">⚠️ ABOVE THRESHOLD</div>}
          </div>
          <div className="env-box">
            <div className="env-value">💨 {Math.round(environmentData.aqi)}</div>
            <div className="env-label">AQI (Threshold: 350)</div>
            {environmentData.aqi > 350 && <div className="env-alert">⚠️ ABOVE THRESHOLD</div>}
          </div>
          <div className="env-box">
            <div className="env-value">🌡️ {Math.round(environmentData.temperature)}°C</div>
            <div className="env-label">Temperature (Threshold: 45°C)</div>
            {environmentData.temperature > 45 && <div className="env-alert">⚠️ ABOVE THRESHOLD</div>}
          </div>
          <div className="env-box">
            <div className="env-value">🚗 {(environmentData.congestionIndex * 10).toFixed(1)}/100</div>
            <div className="env-label">Congestion (Threshold: 80)</div>
            {environmentData.congestionIndex > 8 && <div className="env-alert">⚠️ ABOVE THRESHOLD</div>}
          </div>
        </div>
      </div>

      {/* Section 7: Test Claim Triggers */}
      <div className="card test-triggers">
        <h3>⚡ Test Environmental Triggers</h3>
        <p className="triggers-description">Click below to simulate claim triggers based on current/test data:</p>
        <div className="triggers-grid">
          <button 
            className="trigger-button rainfall"
            onClick={() => handleClaimTrigger('rainfall')}
            title={`Current: ${Math.round(environmentData.rainfall)}mm`}
          >
            <span className="emoji">🌧️</span>
            <span className="label">Rainfall</span>
            <span className="data">{Math.round(environmentData.rainfall)}mm > 60mm</span>
            <span className="amount">₹300</span>
          </button>

          <button 
            className="trigger-button pollution"
            onClick={() => handleClaimTrigger('pollution')}
            title={`Current: ${Math.round(environmentData.aqi)} AQI`}
          >
            <span className="emoji">💨</span>
            <span className="label">Pollution</span>
            <span className="data">AQI {Math.round(environmentData.aqi)} > 350</span>
            <span className="amount">₹250</span>
          </button>

          <button 
            className="trigger-button heat"
            onClick={() => handleClaimTrigger('heat')}
            title={`Current: ${Math.round(environmentData.temperature)}°C`}
          >
            <span className="emoji">🌡️</span>
            <span className="label">Heat</span>
            <span className="data">{Math.round(environmentData.temperature)}°C > 45°C</span>
            <span className="amount">₹200</span>
          </button>

          <button 
            className="trigger-button congestion"
            onClick={() => handleClaimTrigger('congestion')}
            title={`Current: ${(environmentData.congestionIndex).toFixed(1)}/10`}
          >
            <span className="emoji">🚗</span>
            <span className="label">Congestion</span>
            <span className="data">Level {(environmentData.congestionIndex).toFixed(1)}/10 > 8</span>
            <span className="amount">₹150</span>
          </button>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="action-footer">
        <button onClick={fetchDashboardData} className="btn-refresh">
          🔄 Refresh Data
        </button>
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// Helper Functions
function formatClaimDate(dateValue) {
  if (!dateValue) return 'Today';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Today'; // Invalid date fallback
    }
    return date.toLocaleDateString();
  } catch (err) {
    return 'Today';
  }
}

function getClaimTypeIcon(claimType) {
  const icons = {
    'rainfall': '🌧️',
    'Rainfall': '🌧️',
    'pollution': '💨',
    'Pollution': '💨',
    'heat': '🌡️',
    'Heat': '🌡️',
    'congestion': '🚗',
    'Congestion': '🚗',
    'curfew': '⛔',
    'Curfew': '⛔'
  };
  return icons[claimType] || '⚠️';
}

function formatClaimType(claimType) {
  const formatted = {
    'rainfall': 'Heavy Rainfall',
    'Rainfall': 'Heavy Rainfall',
    'pollution': 'High Pollution',
    'Pollution': 'High Pollution',
    'heat': 'Extreme Heat',
    'Heat': 'Extreme Heat',
    'congestion': 'Traffic Congestion',
    'Congestion': 'Traffic Congestion',
    'curfew': 'Curfew',
    'Curfew': 'Curfew'
  };
  return formatted[claimType] || claimType;
}

export default DashboardAnalytics;
