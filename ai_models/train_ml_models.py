"""
Phase 4: Advanced ML Implementation
Create realistic training data and train ML models for fraud detection
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import os

def generate_realistic_training_data(n_samples=10000):
    """
    Generate realistic training data with proper correlations between features and fraud
    """
    np.random.seed(42)

    data = []

    for i in range(n_samples):
        # Base legitimate claim
        claim = {
            'claim_id': f'CLAIM_{i:06d}',
            'worker_id': f'WORKER_{np.random.randint(1, 1000):04d}',
            'claim_amount': np.random.uniform(100, 1000),
            'claim_type': np.random.choice(['HEAVY_RAINFALL', 'SEVERE_POLLUTION', 'SEVERE_CONGESTION', 'EXTREME_HEAT']),
            'latitude': np.random.uniform(12.8, 13.2),  # Bangalore area
            'longitude': np.random.uniform(77.5, 77.8),
            'hour_of_day': np.random.randint(0, 24),
            'day_of_week': np.random.randint(0, 7),
            'is_weekend': 0,
            'worker_experience_months': np.random.randint(1, 60),
            'worker_claims_last_30d': np.random.randint(0, 10),
            'worker_avg_claim_amount': np.random.uniform(200, 800),
            'worker_rejection_rate': np.random.uniform(0, 0.3),
            'location_risk_score': np.random.uniform(0, 1),
            'time_risk_score': np.random.uniform(0, 1),
            'amount_risk_score': np.random.uniform(0, 1),
            'pattern_risk_score': np.random.uniform(0, 1),
            'gps_anomaly_score': 0.0,
            'weather_validity_score': 0.0,
            'behavioral_anomaly_score': 0.0,
            'is_fraud': 0  # Target variable
        }

        # Set weekend flag
        claim['is_weekend'] = 1 if claim['day_of_week'] >= 5 else 0

        # Generate fraud patterns with realistic correlations
        fraud_probability = 0.0

        # GPS fraud: more subtle location anomalies
        if np.random.random() < 0.12:  # Increased frequency but more subtle
            # Instead of completely random locations, make small deviations
            deviation = np.random.uniform(0.1, 0.5)  # Small deviations
            direction = np.random.choice([-1, 1])
            claim['latitude'] += deviation * direction
            claim['longitude'] += deviation * direction * np.random.uniform(0.5, 1.5)
            claim['gps_anomaly_score'] = min(1.0, deviation * 2)  # Score based on deviation
            fraud_probability += min(0.3, deviation * 0.6)

        # Weather fraud: fake claims with subtle indicators
        if np.random.random() < 0.10:  # More common but subtle
            claim['weather_validity_score'] = np.random.uniform(0.3, 0.8)  # Lower scores
            # Weather fraud often happens with suspicious timing
            if claim['hour_of_day'] < 7 or claim['hour_of_day'] > 20:
                fraud_probability += 0.25
            else:
                fraud_probability += 0.15

        # Behavioral fraud: suspicious patterns
        behavioral_risk = 0.0
        if claim['worker_claims_last_30d'] > 6:
            behavioral_risk += 0.2
        if claim['worker_rejection_rate'] > 0.15:
            behavioral_risk += 0.3
        if claim['claim_amount'] > claim['worker_avg_claim_amount'] * 2:
            behavioral_risk += 0.25

        claim['behavioral_anomaly_score'] = min(1.0, behavioral_risk)
        fraud_probability += behavioral_risk * 0.3

        # Amount fraud: unusually high claims (more subtle)
        if claim['claim_amount'] > 600:  # Lower threshold
            base_amount_risk = min(1.0, (claim['claim_amount'] - 600) / 400)  # Gradual increase
            claim['amount_risk_score'] = min(1.0, base_amount_risk + np.random.uniform(-0.2, 0.2))  # Add noise
            fraud_probability += min(0.15, base_amount_risk * 0.25)

        # Pattern fraud: unusual timing (more subtle)
        pattern_risk = 0.0
        if claim['hour_of_day'] < 6 or claim['hour_of_day'] > 22:
            pattern_risk += 0.4
        if claim['is_weekend'] and claim['claim_type'] in ['SEVERE_CONGESTION', 'SEVERE_POLLUTION']:
            pattern_risk += 0.3

        claim['pattern_risk_score'] = min(1.0, pattern_risk + np.random.uniform(-0.15, 0.15))  # Add noise
        fraud_probability += min(0.1, pattern_risk * 0.2)

        # Set time_risk_score based on hour (general risk, not fraud-specific)
        if claim['hour_of_day'] < 6 or claim['hour_of_day'] > 22:
            claim['time_risk_score'] = 0.6 + np.random.uniform(-0.2, 0.2)
        else:
            claim['time_risk_score'] = np.random.uniform(0, 0.3)

        # Determine final fraud label based on accumulated probability with some randomness
        base_probability = fraud_probability
        random_factor = np.random.uniform(-0.2, 0.2)  # Add randomness
        final_probability = min(1.0, max(0.0, base_probability + random_factor))
        claim['is_fraud'] = 1 if final_probability > 0.45 else 0

        # Add some noise to legitimate claims
        if claim['is_fraud'] == 0:
            claim['gps_anomaly_score'] = np.random.uniform(0, 0.3)
            claim['weather_validity_score'] = np.random.uniform(0, 0.4)  # Higher noise
            claim['behavioral_anomaly_score'] = min(1.0, claim['behavioral_anomaly_score'] + np.random.uniform(0, 0.3))
            claim['amount_risk_score'] = np.random.uniform(0, 0.4)
            claim['pattern_risk_score'] = np.random.uniform(0, 0.3)
            # Add small random deviations to location for legitimate claims
            claim['latitude'] += np.random.uniform(-0.05, 0.05)
            claim['longitude'] += np.random.uniform(-0.05, 0.05)

        data.append(claim)

    return pd.DataFrame(data)

def train_fraud_detection_models():
    """
    Train and validate ML models for fraud detection
    """
    print("🔬 Phase 4: Advanced ML Implementation")
    print("=" * 50)

    # Generate training data
    print("📊 Generating training data...")
    df = generate_realistic_training_data(10000)

    print(f"✅ Generated {len(df)} training samples")
    print(f"Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.1f}%)")
    print(f"Legitimate cases: {(1-df['is_fraud']).sum()} ({(1-df['is_fraud'].mean())*100:.1f}%)")

    # Prepare features
    feature_cols = [
        'claim_amount', 'hour_of_day', 'day_of_week', 'is_weekend',
        'worker_experience_months', 'worker_claims_last_30d', 'worker_avg_claim_amount',
        'worker_rejection_rate', 'location_risk_score', 'time_risk_score',
        'amount_risk_score', 'pattern_risk_score', 'gps_anomaly_score',
        'weather_validity_score', 'behavioral_anomaly_score'
    ]

    X = df[feature_cols]
    y = df['is_fraud']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("\n🤖 Training ML Models...")

    # Train Random Forest
    print("🌲 Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=4,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    rf_model.fit(X_train_scaled, y_train)

    # Train Gradient Boosting
    print("🚀 Training Gradient Boosting...")
    gb_model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42
    )
    gb_model.fit(X_train_scaled, y_train)

    # Model Evaluation
    print("\n📈 Model Performance Evaluation")
    print("=" * 40)

    models = {
        'Random Forest': rf_model,
        'Gradient Boosting': gb_model
    }

    for name, model in models.items():
        print(f"\n🔍 {name} Performance:")

        # Predictions
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

        # Metrics
        print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraud']))

        # AUC Score
        auc = roc_auc_score(y_test, y_pred_proba)
        print(".4f")

        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='roc_auc')
        print(".4f")

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        print("Confusion Matrix:")
        print(f"  True Neg: {cm[0][0]}, False Pos: {cm[0][1]}")
        print(f"  False Neg: {cm[1][0]}, True Pos: {cm[1][1]}")

    # Feature Importance Analysis
    print("\n🎯 Top 10 Important Features (Random Forest):")
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)

    for i, row in feature_importance.head(10).iterrows():
        print("6.4f")

    # Save models
    print("\n💾 Saving trained models...")
    model_dir = os.path.dirname(__file__)

    joblib.dump(rf_model, os.path.join(model_dir, 'random_forest_model.pkl'))
    joblib.dump(gb_model, os.path.join(model_dir, 'gradient_boost_model.pkl'))
    joblib.dump(scaler, os.path.join(model_dir, 'scaler.pkl'))

    # Save training data for reference
    df.to_csv(os.path.join(model_dir, 'training_data.csv'), index=False)

    print("✅ Models saved successfully!")
    print("📁 Files saved:")
    print("  - random_forest_model.pkl")
    print("  - gradient_boost_model.pkl")
    print("  - scaler.pkl")
    print("  - training_data.csv")

    return rf_model, gb_model, scaler, feature_cols

if __name__ == "__main__":
    train_fraud_detection_models()