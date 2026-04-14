import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminFraudDashboard.css';

export default function AdminFraudDashboard() {
  const [stats, setStats] = useState(null);
  const [flaggedWorkers, setFlaggedWorkers] = useState([]);
  const [highRiskClaims, setHighRiskClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all'); // all, high, medium, low

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/fraud/dashboard');
      
      if (response.data.success) {
        const data = response.data.data;
        setStats(data.statistics);
        setFlaggedWorkers(data.flaggedWorkers || []);
        setHighRiskClaims(data.recentHighRiskClaims || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load fraud dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="admin-fraud-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Fraud Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-fraud-dashboard">
      <div className="dashboard-header">
        <h1>🔒 Fraud Detection & Risk Management Dashboard</h1>
        <p className="subtitle">Real-time monitoring of suspicious claims and worker patterns</p>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          🔄 Refresh Data
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-card total">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <p className="kpi-label">Total Claims</p>
            <h2 className="kpi-value">{stats?.totalClaims || 0}</h2>
          </div>
        </div>

        <div className="kpi-card approved">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <p className="kpi-label">Auto-Approved</p>
            <h2 className="kpi-value">{stats?.autoApproved || 0}</h2>
          </div>
        </div>

        <div className="kpi-card medium">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-content">
            <p className="kpi-label">Flagged for Review</p>
            <h2 className="kpi-value">{stats?.flaggedForManualReview || 0}</h2>
          </div>
        </div>

        <div className="kpi-card high-risk">
          <div className="kpi-icon">🚨</div>
          <div className="kpi-content">
            <p className="kpi-label">High Risk Claims</p>
            <h2 className="kpi-value">{stats?.highRiskClaims || 0}</h2>
          </div>
        </div>

        <div className="kpi-card fraud-rate">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <p className="kpi-label">Fraud Rate</p>
            <h2 className="kpi-value">{parseFloat(stats?.fraudRate || 0).toFixed(1)}%</h2>
          </div>
        </div>
      </div>

      {/* Risk Breakdown Chart */}
      <div className="chart-section">
        <div className="chart-card">
          <h3>💊 Risk Level Distribution</h3>
          <div className="risk-breakdown">
            <div className="risk-bar">
              <div className="risk-label">
                <span className="low-badge">LOW</span>
                <span className="count">{stats?.lowRiskClaims || 0}</span>
              </div>
              <div className="risk-progress">
                <div 
                  className="risk-fill low"
                  style={{width: `${((stats?.lowRiskClaims || 0) / (stats?.totalClaims || 1)) * 100}%`}}
                />
              </div>
            </div>

            <div className="risk-bar">
              <div className="risk-label">
                <span className="medium-badge">MEDIUM</span>
                <span className="count">{stats?.mediumRiskClaims || 0}</span>
              </div>
              <div className="risk-progress">
                <div 
                  className="risk-fill medium"
                  style={{width: `${((stats?.mediumRiskClaims || 0) / (stats?.totalClaims || 1)) * 100}%`}}
                />
              </div>
            </div>

            <div className="risk-bar">
              <div className="risk-label">
                <span className="high-badge">HIGH</span>
                <span className="count">{stats?.highRiskClaims || 0}</span>
              </div>
              <div className="risk-progress">
                <div 
                  className="risk-fill high"
                  style={{width: `${((stats?.highRiskClaims || 0) / (stats?.totalClaims || 1)) * 100}%`}}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Detection Sources */}
        <div className="chart-card">
          <h3>🔍 Detection Sources</h3>
          <div className="detection-sources">
            <div className="source">
              <div className="source-icon">🗺️</div>
              <div className="source-info">
                <p className="source-name">GPS Spoofing Detection</p>
                <p className="source-desc">Impossible travel patterns flagged</p>
              </div>
              <div className="source-stat">35%</div>
            </div>

            <div className="source">
              <div className="source-icon">🌧️</div>
              <div className="source-info">
                <p className="source-name">Weather Claim Validation</p>
                <p className="source-desc">Mismatch with historical data</p>
              </div>
              <div className="source-stat">40%</div>
            </div>

            <div className="source">
              <div className="source-icon">📊</div>
              <div className="source-info">
                <p className="source-name">Behavioral Anomaly Detection</p>
                <p className="source-desc">Pattern deviations from baseline</p>
              </div>
              <div className="source-stat">25%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Workers */}
      <div className="workers-section">
        <h3>⚠️ Flagged Workers ({flaggedWorkers.length})</h3>
        {flaggedWorkers.length === 0 ? (
          <div className="empty-state">
            <p>✅ No flagged workers. All claims appear legitimate.</p>
          </div>
        ) : (
          <div className="workers-grid">
            {flaggedWorkers.map((worker, idx) => (
              <div key={idx} className="worker-card">
                <div className="worker-header">
                  <h4>{worker.name || 'Worker ' + idx}</h4>
                  <span className={`risk-badge ${worker.riskLevel?.toLowerCase()}`}>
                    {worker.riskLevel}
                  </span>
                </div>
                <div className="worker-info">
                  <p><strong>Email:</strong> {worker.email}</p>
                  <p><strong>Platform:</strong> {worker.platform}</p>
                  <p><strong>Location:</strong> {worker.location}</p>
                  <p><strong>Flagged Claims:</strong> {worker.flaggedCount || 0}</p>
                  <p><strong>Fraud Score:</strong> {parseFloat(worker.avgFraudScore || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent High-Risk Claims */}
      <div className="claims-section">
        <h3>🚨 Recent High-Risk Claims ({highRiskClaims.length})</h3>
        {highRiskClaims.length === 0 ? (
          <div className="empty-state">
            <p>✅ No high-risk claims detected in recent activity.</p>
          </div>
        ) : (
          <div className="claims-table">
            <table>
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Worker</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Fraud Score</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {highRiskClaims.map((claim, idx) => (
                  <tr key={idx} className={`risk-${claim.riskLevel?.toLowerCase()}`}>
                    <td className="claim-id">{claim.claimId?.substring(0, 8)}...</td>
                    <td>{claim.workerName || 'N/A'}</td>
                    <td>
                      {claim.claimType === 'rainfall' && '🌧️'}
                      {claim.claimType === 'pollution' && '💨'}
                      {claim.claimType === 'heat' && '🌡️'}
                      {claim.claimType === 'congestion' && '🚗'}
                      {' '}{claim.claimType}
                    </td>
                    <td>₹{claim.claimAmount}</td>
                    <td>
                      <span className="fraud-score">
                        {parseFloat(claim.fraudScore || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${claim.riskLevel?.toLowerCase()}`}>
                        {claim.riskLevel}
                      </span>
                    </td>
                    <td>{claim.status}</td>
                    <td>
                      <button className="action-btn override">Override</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="metrics-section">
        <div className="metric-card">
          <h4>⚡ System Performance</h4>
          <div className="metric-item">
            <p>Fraud Detection Accuracy</p>
            <div className="metric-bar">
              <div className="metric-fill" style={{width: '85%'}}></div>
            </div>
            <span className="metric-value">85%</span>
          </div>
          <div className="metric-item">
            <p>False Positive Rate</p>
            <div className="metric-bar">
              <div className="metric-fill warning" style={{width: '8%'}}></div>
            </div>
            <span className="metric-value">8%</span>
          </div>
          <div className="metric-item">
            <p>Processing Speed (avg)</p>
            <p className="metric-label">450ms per claim</p>
          </div>
        </div>

        <div className="metric-card">
          <h4>💰 Financial Impact</h4>
          <div className="metric-item">
            <p>Total Claims Processed</p>
            <p className="metric-value-large">₹{((stats?.totalClaims || 0) * 300).toLocaleString()}</p>
          </div>
          <div className="metric-item">
            <p>Potential Fraud Saved</p>
            <p className="metric-value-large" style={{color: '#28a745'}}>
              ₹{((stats?.highRiskClaims || 0) * 300).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="footer">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <p className="auto-refresh">Auto-refreshing every 5 seconds</p>
      </div>
    </div>
  );
}
