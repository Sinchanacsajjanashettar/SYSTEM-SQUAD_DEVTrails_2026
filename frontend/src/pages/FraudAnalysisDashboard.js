import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FraudAnalysisDashboard.css';

export default function FraudAnalysisDashboard() {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    fetchAnalysisData();
    const interval = setInterval(fetchAnalysisData, 5000);
    return () => clearInterval(interval);
  }, [filterRisk]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      // Get all claims with fraud scores
      const claimsRes = await axios.get('http://localhost:5000/api/fraud/dashboard');
      const statsRes = await axios.get('http://localhost:5000/api/fraud/statistics');

      if (claimsRes.data.success) {
        let allClaims = claimsRes.data.data.allClaims || [];
        
        // Filter by risk level
        if (filterRisk !== 'all') {
          if (filterRisk === 'unknown') {
            allClaims = allClaims.filter(c => !c.riskLevel);
          } else {
            allClaims = allClaims.filter(c => c.riskLevel === filterRisk);
          }
        }

        setClaims(allClaims);
        setError(null);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load fraud analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280'; // Gray for unknown
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return '🚩';
      case 'medium':
        return '⚠️';
      case 'low':
        return '✅';
      default:
        return '❓';
    }
  };

  if (loading && !stats) {
    return (
      <div className="fraud-analysis-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Fraud Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fraud-analysis-container">
      <div className="analysis-header">
        <h1>🔬 ML Fraud Analysis Dashboard</h1>
        <p className="subtitle">Advanced Risk Detection with GPS, Weather & Behavioral Analysis</p>
        <button className="refresh-btn" onClick={fetchAnalysisData}>
          🔄 Refresh Data
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Risk Level Filter */}
      <div className="filter-section">
        <button 
          className={`filter-btn ${filterRisk === 'all' ? 'active' : ''}`}
          onClick={() => setFilterRisk('all')}
        >
          All Claims ({claims.length})
        </button>
        <button 
          className={`filter-btn high ${filterRisk === 'high' ? 'active' : ''}`}
          onClick={() => setFilterRisk('high')}
        >
          🚩 High Risk ({stats?.highRiskClaims || 0})
        </button>
        <button 
          className={`filter-btn medium ${filterRisk === 'medium' ? 'active' : ''}`}
          onClick={() => setFilterRisk('medium')}
        >
          ⚠️ Medium Risk ({stats?.mediumRiskClaims || 0})
        </button>
        <button 
          className={`filter-btn low ${filterRisk === 'low' ? 'active' : ''}`}
          onClick={() => setFilterRisk('low')}
        >
          ✅ Low Risk ({stats?.lowRiskClaims || 0})
        </button>
        <button 
          className={`filter-btn unknown ${filterRisk === 'unknown' ? 'active' : ''}`}
          onClick={() => setFilterRisk('unknown')}
        >
          ❓ Unknown ({claims.filter(c => !c.riskLevel).length})
        </button>
      </div>

      {/* KPI Cards with Risk Breakdown */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <p className="kpi-label">Total Claims</p>
            <h2 className="kpi-value">{stats?.totalClaims || 0}</h2>
          </div>
        </div>

        <div className="kpi-card high">
          <div className="kpi-icon">🚩</div>
          <div className="kpi-content">
            <p className="kpi-label">High Risk</p>
            <h2 className="kpi-value">{stats?.highRiskClaims || 0}</h2>
            <p className="kpi-percent">{stats?.highRiskPercent || 0}%</p>
          </div>
        </div>

        <div className="kpi-card medium">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-content">
            <p className="kpi-label">Medium Risk</p>
            <h2 className="kpi-value">{stats?.mediumRiskClaims || 0}</h2>
            <p className="kpi-percent">{stats?.mediumRiskPercent || 0}%</p>
          </div>
        </div>

        <div className="kpi-card low">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <p className="kpi-label">Low Risk</p>
            <h2 className="kpi-value">{stats?.lowRiskClaims || 0}</h2>
            <p className="kpi-percent">{stats?.lowRiskPercent || 0}%</p>
          </div>
        </div>
      </div>

      {/* Claims with ML Scores */}
      <div className="claims-section">
        <h2>📋 Claims with ML Fraud Scores</h2>
        
        {claims.length === 0 ? (
          <div className="no-claims">
            <p>No claims with {filterRisk === 'unknown' ? 'unknown' : filterRisk} risk level</p>
          </div>
        ) : (
          <div className="claims-grid">
            {claims.map((claim) => (
              <div 
                key={claim._id} 
                className="claim-card"
                style={{ borderLeft: `4px solid ${getRiskColor(claim.riskLevel)}` }}
              >
                <div className="claim-header">
                  <div className="claim-title">
                    <span className="risk-icon">{getRiskIcon(claim.riskLevel)}</span>
                    <h3>{claim.claimType}</h3>
                  </div>
                  <span className="claim-amount">₹{claim.claimAmount}</span>
                </div>

                <div className="claim-fraud-score">
                  <div className="score-display">
                    <span className="fraud-score">
                      {claim.fraudScore !== undefined ? (claim.fraudScore * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                    <span className="risk-level" style={{ color: getRiskColor(claim.riskLevel) }}>
                      {claim.riskLevel?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="score-bar">
                    <div 
                      className="score-fill"
                      style={{ 
                        width: claim.fraudScore !== undefined ? `${claim.fraudScore * 100}%` : '0%',
                        backgroundColor: getRiskColor(claim.riskLevel)
                      }}
                    ></div>
                  </div>
                </div>

                {/* ML Analysis Breakdown */}
                {claim.fraudDetails ? (
                  <div className="fraud-analysis">
                    <div className="analysis-item">
                      <span className="analysis-label">🛰️ GPS Analysis</span>
                      <span className="analysis-score">
                        {claim.fraudDetails.gps?.fraud_score !== undefined 
                          ? `${(claim.fraudDetails.gps.fraud_score * 100).toFixed(0)}% ${claim.fraudDetails.gps.risk_level}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">🌤️ Weather Analysis</span>
                      <span className="analysis-score">
                        {claim.fraudDetails.weather?.fraud_score !== undefined
                          ? `${(claim.fraudDetails.weather.fraud_score * 100).toFixed(0)}% ${claim.fraudDetails.weather.risk_level}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">🧠 Behavioral Analysis</span>
                      <span className="analysis-score">
                        {claim.fraudDetails.behavioral?.behavioral_score !== undefined
                          ? `${(claim.fraudDetails.behavioral.behavioral_score * 100).toFixed(0)}% ${claim.fraudDetails.behavioral.risk_level}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="fraud-analysis">
                    <div className="analysis-placeholder">
                      <span>⚠️ ML Analysis Not Available</span>
                      <small>This claim was processed before ML fraud detection was implemented</small>
                    </div>
                  </div>
                )}

                <div className="claim-meta">
                  <span className="status">Status: {claim.status}</span>
                  <span className="date">{new Date(claim.createdAt).toLocaleDateString()}</span>
                </div>

                <button 
                  className="details-btn"
                  onClick={() => setSelectedClaim(claim)}
                >
                  📊 View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Claim Modal */}
      {selectedClaim && (
        <div className="modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedClaim(null)}>✕</button>
            
            <h2>{selectedClaim.claimType} - Detailed Analysis</h2>
            
            <div className="modal-section">
              <h3>📊 Overall Risk Assessment</h3>
              <div className="risk-card">
                <p><strong>Composite Fraud Score:</strong> {(selectedClaim.fraudScore * 100).toFixed(2)}%</p>
                <p><strong>Risk Level:</strong> <span style={{ color: getRiskColor(selectedClaim.riskLevel) }}>
                  {selectedClaim.riskLevel?.toUpperCase()}
                </span></p>
                <p><strong>Status:</strong> {selectedClaim.status}</p>
                <p><strong>Amount:</strong> ₹{selectedClaim.claimAmount}</p>
              </div>
            </div>

            {selectedClaim.fraudDetails && (
              <>
                <div className="modal-section">
                  <h3>🛰️ GPS Spoofing Detection</h3>
                  <div className="analysis-detail">
                    <p><strong>Score:</strong> {selectedClaim.fraudDetails.gps?.fraud_score?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Risk:</strong> {selectedClaim.fraudDetails.gps?.risk_level || 'N/A'}</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                      {selectedClaim.fraudDetails.gps?.reason?.map((r, i) => (
                        <li key={i}>{r}</li>
                      )) || <li>No GPS anomalies detected</li>}
                    </ul>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>🌤️ Weather Validation</h3>
                  <div className="analysis-detail">
                    <p><strong>Score:</strong> {selectedClaim.fraudDetails.weather?.fraud_score?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Risk:</strong> {selectedClaim.fraudDetails.weather?.risk_level || 'N/A'}</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                      {selectedClaim.fraudDetails.weather?.reason?.map((r, i) => (
                        <li key={i}>{r}</li>
                      )) || <li>Weather data validated</li>}
                    </ul>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>🧠 Behavioral Pattern Analysis</h3>
                  <div className="analysis-detail">
                    <p><strong>Score:</strong> {selectedClaim.fraudDetails.behavioral?.behavioral_score?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Risk:</strong> {selectedClaim.fraudDetails.behavioral?.risk_level || 'N/A'}</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                      {selectedClaim.fraudDetails.behavioral?.reason?.map((r, i) => (
                        <li key={i}>{r}</li>
                      )) || <li>Normal behavioral patterns detected</li>}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={() => setSelectedClaim(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
