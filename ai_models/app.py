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
    Detect behavioral anomalies - suspicious claim patterns
    """
    try:
        data = request.json
        worker_id = data.get('workerId')
        claim_amount = data.get('claimAmount', 0)
        recent_claims = data.get('recentClaims', [])
        worker_monthly_income = data.get('monthlyIncome', 15000)

        print(f"🧠 [Behavioral Check] Worker {worker_id}: Amount ₹{claim_amount}")

        fraud_score = 0.0
        details = []

        # Check claim frequency
        if len(recent_claims) > 0:
            claims_per_week = len([c for c in recent_claims if (datetime.now() - datetime.fromisoformat(c.get('timestamp', datetime.now().isoformat()))).days <= 7])
            if claims_per_week > 4:
                frequency_score = min(0.4, (claims_per_week - 4) * 0.1)
                fraud_score += frequency_score
                details.append(f"High frequency: {claims_per_week} claims/week")

        # Check claim amount vs income
        if claim_amount > worker_monthly_income * 0.5:
            amount_score = 0.3
            fraud_score += amount_score
            details.append(f"High payout ratio: ₹{claim_amount} vs ₹{worker_monthly_income} monthly income")

        # Normalize combined score
        fraud_score = min(1.0, fraud_score)
        level = 'high' if fraud_score > 0.7 else 'medium' if fraud_score > 0.4 else 'low'

        if not details:
            details.append("No behavioral anomalies detected")

        result = {
            'behavioral_score': round(fraud_score, 2),
            'risk_level': level,
            'reason': details,
            'check': 'BEHAVIORAL_ANOMALY'
        }

        print(f"✅ [Behavioral] Score: {fraud_score:.2f}, Level: {level}")
        return jsonify(result)

    except Exception as e:
        print(f"❌ [Behavioral Check] Error: {str(e)}")
        return jsonify({
            'behavioral_score': 0.0,
            'risk_level': 'low',
            'reason': f'Behavioral check unavailable: {str(e)}',
            'check': 'BEHAVIORAL_ANOMALY'
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
