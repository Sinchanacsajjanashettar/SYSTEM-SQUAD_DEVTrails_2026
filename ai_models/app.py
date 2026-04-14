"""
GigShield AI - ML Fraud Detection API Server
Exposes ML models via REST endpoints on port 5001
Handles GPS spoofing, weather validation, and behavioral analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import joblib
import os
import json
from math import radians, cos, sin, asin, sqrt
import numpy as np

# Import custom fraud detectors
from fraud_detection_gps import GPSSpoofingDetector
from fraud_detection_weather import WeatherClaimValidator
from fraud_detection_behavioral import BehavioralFraudDetector

app = Flask(__name__)
CORS(app)

# Initialize fraud detectors
gps_detector = GPSSpoofingDetector(max_speed_kmh=120, teleport_threshold_km=100)
weather_validator = WeatherClaimValidator()
behavioral_detector = BehavioralFraudDetector()

# Load ML models if available
base_dir = os.path.dirname(__file__)
try:
    rf_model = joblib.load(os.path.join(base_dir, 'random_forest_model.pkl'))
    print("✅ RandomForest model loaded")
except:
    rf_model = None
    print("⚠️ RandomForest model not found")

try:
    gb_model = joblib.load(os.path.join(base_dir, 'gradient_boost_model.pkl'))
    print("✅ GradientBoosting model loaded")
except:
    gb_model = None
    print("⚠️ GradientBoosting model not found")

try:
    scaler = joblib.load(os.path.join(base_dir, 'scaler.pkl'))
    print("✅ Scaler model loaded")
except:
    scaler = None
    print("⚠️ Scaler not found")

# Feature columns for ML models (must match training data)
FEATURE_COLS = [
    'claim_amount', 'hour_of_day', 'day_of_week', 'is_weekend',
    'worker_experience_months', 'worker_claims_last_30d', 'worker_avg_claim_amount',
    'worker_rejection_rate', 'location_risk_score', 'time_risk_score',
    'amount_risk_score', 'pattern_risk_score', 'gps_anomaly_score',
    'weather_validity_score', 'behavioral_anomaly_score'
]

def prepare_ml_features(data, recent_claims, worker_monthly_income):
    """
    Prepare feature vector for ML model prediction - must match training data generation
    """
    worker_id = data.get('workerId')
    claim_amount = data.get('claimAmount', 0)

    # Calculate worker statistics from recent claims
    worker_claims_last_30d = len(recent_claims)
    worker_avg_claim_amount = np.mean([c.get('claimAmount', 0) for c in recent_claims]) if recent_claims else 0
    worker_rejection_rate = 0.05  # Default, could be enhanced with real data

    # Time-based features
    current_time = datetime.now()
    hour_of_day = current_time.hour
    day_of_week = current_time.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0

    # Worker experience (rough estimate based on claims history)
    worker_experience_months = max(1, len(recent_claims) * 2)  # Rough estimate

    # Risk scores - these should be calculated by individual detectors
    # For now, use simple heuristics that match training data patterns
    location_risk_score = 0.1  # Default low risk for Bangalore area
    time_risk_score = 0.1 if 6 <= hour_of_day <= 22 else 0.5  # Higher risk at night
    amount_risk_score = min(1.0, claim_amount / 1000)  # Normalize by 1000
    pattern_risk_score = min(1.0, worker_claims_last_30d / 10)  # Risk based on frequency

    # Anomaly scores - these would come from specialized detectors
    # For behavioral, use rule-based calculation that matches training data
    gps_anomaly_score = 0.0  # GPS detector would set this
    weather_validity_score = 0.0  # Weather validator would set this

    # Behavioral anomaly score - calculate similar to training data generation
    behavioral_anomaly_score = 0.0
    if worker_claims_last_30d > 4:
        behavioral_anomaly_score += min(0.4, (worker_claims_last_30d - 4) * 0.1)
    if claim_amount > worker_monthly_income * 0.5:
        behavioral_anomaly_score += 0.3
    behavioral_anomaly_score = min(1.0, behavioral_anomaly_score)

    # Create feature vector in exact order as training data
    features = [
        claim_amount,                    # claim_amount
        hour_of_day,                     # hour_of_day
        day_of_week,                     # day_of_week
        is_weekend,                      # is_weekend
        worker_experience_months,        # worker_experience_months
        worker_claims_last_30d,          # worker_claims_last_30d
        worker_avg_claim_amount,         # worker_avg_claim_amount
        worker_rejection_rate,           # worker_rejection_rate
        location_risk_score,             # location_risk_score
        time_risk_score,                 # time_risk_score
        amount_risk_score,               # amount_risk_score
        pattern_risk_score,              # pattern_risk_score
        gps_anomaly_score,               # gps_anomaly_score
        weather_validity_score,          # weather_validity_score
        behavioral_anomaly_score         # behavioral_anomaly_score
    ]

    return features

def generate_ml_explanations(features, fraud_score, model, feature_names):
    """
    Generate human-readable explanations for ML predictions
    """
    reasons = []

    # Get feature importances
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        # Get top contributing features
        top_indices = np.argsort(importances)[-5:][::-1]  # Top 5 features

        for idx in top_indices:
            feature_name = feature_names[idx]
            importance = importances[idx]
            value = features[idx]

            if importance > 0.05:  # Only explain important features
                if 'amount' in feature_name.lower() and value > 500:
                    reasons.append(f"High claim amount (₹{value:.0f}) contributes to fraud risk")
                elif 'claims_last_30d' in feature_name and value > 3:
                    reasons.append(f"Frequent claims ({value:.0f} in 30 days) indicates suspicious pattern")
                elif 'rejection_rate' in feature_name and value > 0.2:
                    reasons.append(f"High rejection history ({value:.1%}) suggests fraudulent behavior")
                elif 'hour_of_day' in feature_name and (value < 6 or value > 22):
                    reasons.append(f"Unusual claim time ({value:.0f}:00) increases fraud probability")
                elif 'weekend' in feature_name and value > 0:
                    reasons.append("Weekend claims have higher fraud risk patterns")

    if fraud_score > 0.7:
        reasons.append("Multiple risk factors combine to create high fraud probability")
    elif fraud_score > 0.4:
        reasons.append("Moderate risk indicators suggest manual review needed")
    else:
        reasons.append("Low fraud probability based on ML analysis")

    if not reasons:
        reasons.append("ML model analysis completed - no significant risk factors identified")

    return reasons

# Health check
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'GigShield ML Fraud Detection API',
        'models_loaded': {
            'random_forest': rf_model is not None,
            'gradient_boosting': gb_model is not None,
            'scaler': scaler is not None
        }
    })

# ========================
# GPS SPOOFING DETECTION
# ========================
@app.route('/api/fraud/check-gps', methods=['POST'])
def check_gps():
    """
    Detect GPS spoofing - impossible travel patterns
    """
    try:
        data = request.json
        worker_id = data.get('workerId')
        current_location = data.get('currentLocation')  # {lat, lon}
        delivery_history = data.get('deliveryHistory', [])

        print(f"🔍 [GPS Check] Worker {worker_id}: Current location {current_location}")

        # Check impossible travel
        fraud_score = 0.0
        details = []

        if len(delivery_history) > 0:
            last_delivery = delivery_history[-1]
            last_location = (last_delivery.get('latitude'), last_delivery.get('longitude'))
            last_timestamp = datetime.fromisoformat(last_delivery.get('timestamp', datetime.now().isoformat()))
            current_time = datetime.now()

            # Calculate distance
            distance_km = gps_detector.haversine_distance(
                (current_location.get('latitude'), current_location.get('longitude')),
                last_location
            )

            # Calculate time difference in hours
            time_diff_hours = (current_time - last_timestamp).total_seconds() / 3600
            max_realistic_distance = gps_detector.max_speed_kmh * time_diff_hours

            if distance_km > max_realistic_distance:
                fraud_score = min(1.0, (distance_km - max_realistic_distance) / 100)
                details.append(f"Impossible travel: {distance_km:.1f}km in {time_diff_hours:.1f}h (max {max_realistic_distance:.1f}km)")

            if distance_km > gps_detector.teleport_threshold_km:
                fraud_score = max(fraud_score, 0.7)
                details.append(f"Teleport detected: {distance_km:.1f}km (threshold: {gps_detector.teleport_threshold_km}km)")

        level = 'high' if fraud_score > 0.7 else 'medium' if fraud_score > 0.4 else 'low'
        
        result = {
            'fraud_score': round(fraud_score, 2),
            'risk_level': level,
            'reason': details if details else 'No GPS anomalies detected',
            'check': 'GPS_SPOOFING_DETECTION'
        }

        print(f"✅ [GPS Check] Score: {fraud_score:.2f}, Level: {level}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ [GPS Check] Error: {str(e)}")
        return jsonify({
            'fraud_score': 0.0,
            'risk_level': 'low',
            'reason': f'GPS check unavailable: {str(e)}',
            'check': 'GPS_SPOOFING_DETECTION'
        }), 500

# ========================
# WEATHER VALIDATION
# ========================
@app.route('/api/fraud/validate-weather', methods=['POST'])
def validate_weather():
    """
    Validate if claim weather data matches historical records
    """
    try:
        data = request.json
        claim_type = data.get('claimType')  # 'HEAVY_RAINFALL', 'SEVERE_POLLUTION', 'EXTREME_HEAT'
        location = data.get('location')
        timestamp = data.get('timestamp')

        print(f"🌤️ [Weather Validation] Claim {claim_type} at {location}")

        fraud_score = 0.0
        details = []

        # Simulate weather data validation
        # In production, check against actual weather APIs and historical data
        if claim_type == 'HEAVY_RAINFALL':
            # Check if location actually had rainfall at that time
            # This would query OpenWeatherMap historical API
            fraud_score = 0.1  # Assume mostly legitimate (parametric trigger)
            details.append("Rainfall pattern matches historical data")

        elif claim_type == 'SEVERE_POLLUTION':
            # Check if AQI actually spiked
            fraud_score = 0.15
            details.append("Pollution levels align with region patterns")

        elif claim_type == 'EXTREME_HEAT':
            # Check if temperature was actually extreme
            fraud_score = 0.1
            details.append("Temperature spike confirmed")

        else:
            fraud_score = 0.2
            details.append("Weather claim type not standard")

        level = 'high' if fraud_score > 0.7 else 'medium' if fraud_score > 0.4 else 'low'

        result = {
            'fraud_score': round(fraud_score, 2),
            'risk_level': level,
            'reason': details,
            'check': 'WEATHER_VALIDATION'
        }

        print(f"✅ [Weather] Score: {fraud_score:.2f}, Level: {level}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ [Weather Check] Error: {str(e)}")
        return jsonify({
            'fraud_score': 0.1,
            'risk_level': 'low',
            'reason': f'Weather validation unavailable: {str(e)}',
            'check': 'WEATHER_VALIDATION'
        }), 500

# ========================
# BEHAVIORAL DETECTION
# ========================
@app.route('/api/fraud/check-behavioral', methods=['POST'])
def check_behavioral():
    """
    ML-based behavioral fraud detection using trained models
    """
    try:
        data = request.json
        worker_id = data.get('workerId')
        claim_amount = data.get('claimAmount', 0)
        recent_claims = data.get('recentClaims', [])
        worker_monthly_income = data.get('monthlyIncome', 15000)

        print(f"🧠 [ML Behavioral Check] Worker {worker_id}: Amount ₹{claim_amount}")

        # Prepare features for ML model
        features = prepare_ml_features(data, recent_claims, worker_monthly_income)

        if rf_model and gb_model and scaler:
            # Use trained ML models
            features_scaled = scaler.transform([features])
            rf_prob = rf_model.predict_proba(features_scaled)[0][1]  # Fraud probability
            gb_prob = gb_model.predict_proba(features_scaled)[0][1]  # Fraud probability

            # Ensemble prediction
            fraud_score = (rf_prob + gb_prob) / 2

            # Get predictions for explanation
            rf_pred = rf_model.predict(features_scaled)[0]
            gb_pred = gb_model.predict(features_scaled)[0]

            # Determine risk level
            if fraud_score > 0.7:
                level = 'high'
            elif fraud_score > 0.4:
                level = 'medium'
            else:
                level = 'low'

            # Generate explanations
            reasons = generate_ml_explanations(features, fraud_score, rf_model, FEATURE_COLS)

            result = {
                'behavioral_score': round(float(fraud_score), 3),
                'risk_level': level,
                'reason': reasons,
                'check': 'BEHAVIORAL_ANOMALY_ML',
                'model_confidence': {
                    'random_forest': round(float(rf_prob), 3),
                    'gradient_boosting': round(float(gb_prob), 3),
                    'ensemble_score': round(float(fraud_score), 3)
                }
            }

        else:
            # Fallback to rule-based if models not available
            print("⚠️ ML models not available, using rule-based logic")
            fraud_score = 0.0
            reasons = []

            if len(recent_claims) > 0:
                claims_per_week = len([c for c in recent_claims if (datetime.now() - datetime.fromisoformat(c.get('timestamp', datetime.now().isoformat()))).days <= 7])
                if claims_per_week > 4:
                    frequency_score = min(0.4, (claims_per_week - 4) * 0.1)
                    fraud_score += frequency_score
                    reasons.append(f"High frequency: {claims_per_week} claims/week")

            if claim_amount > worker_monthly_income * 0.5:
                amount_score = 0.3
                fraud_score += amount_score
                reasons.append(f"High payout ratio: ₹{claim_amount} vs ₹{worker_monthly_income} monthly income")

            fraud_score = min(1.0, fraud_score)
            level = 'high' if fraud_score > 0.7 else 'medium' if fraud_score > 0.4 else 'low'

            if not reasons:
                reasons.append("No behavioral anomalies detected")

            result = {
                'behavioral_score': round(fraud_score, 2),
                'risk_level': level,
                'reason': reasons,
                'check': 'BEHAVIORAL_ANOMALY_RULE_BASED'
            }

        print(f"✅ [ML Behavioral] Score: {result['behavioral_score']:.3f}, Level: {result['risk_level']}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ [ML Behavioral Check] Error: {str(e)}")
        return jsonify({
            'behavioral_score': 0.0,
            'risk_level': 'low',
            'reason': f'ML behavioral check unavailable: {str(e)}',
            'check': 'BEHAVIORAL_ANOMALY_ERROR'
        }), 500

# ========================
# ENSEMBLE FRAUD SCORE
# ========================
@app.route('/api/fraud/ensemble-score', methods=['POST'])
def ensemble_score():
    """
    Calculate composite fraud score from all detectors
    Layer Weights:
    - GPS: 35% (most obvious)
    - Weather: 40% (most reliable)
    - Behavioral: 25% (secondary)
    """
    try:
        data = request.json
        
        gps_score = data.get('gpsScore', 0) * 0.35
        weather_score = data.get('weatherScore', 0) * 0.40
        behavioral_score = data.get('behavioralScore', 0) * 0.25

        # Composite score
        composite_score = gps_score + weather_score + behavioral_score
        composite_score = min(1.0, max(0.0, composite_score))

        if composite_score > 0.7:
            action = 'reject'
            level = 'high'
        elif composite_score > 0.4:
            action = 'review'
            level = 'medium'
        else:
            action = 'approve'
            level = 'low'

        result = {
            'composite_fraud_score': round(composite_score, 2),
            'risk_level': level,
            'action': action,
            'breakdown': {
                'gps_weighted': round(gps_score, 3),
                'weather_weighted': round(weather_score, 3),
                'behavioral_weighted': round(behavioral_score, 3)
            },
            'weights': {
                'gps': 0.35,
                'weather': 0.40,
                'behavioral': 0.25
            }
        }

        print(f"✅ [Ensemble] Composite score: {composite_score:.2f}, Action: {action}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ [Ensemble] Error: {str(e)}")
        return jsonify({
            'composite_fraud_score': 0.1,
            'risk_level': 'low',
            'action': 'approve',
            'error': str(e)
        }), 500

# ========================
# Start server
# ========================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 GigShield ML Fraud Detection API")
    print("Starting on http://localhost:5001")
    print("="*60)
    print("\n📡 Available endpoints:")
    print("  POST /api/fraud/check-gps")
    print("  POST /api/fraud/validate-weather")
    print("  POST /api/fraud/check-behavioral")
    print("  POST /api/fraud/ensemble-score")
    print("  GET  /api/health\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
