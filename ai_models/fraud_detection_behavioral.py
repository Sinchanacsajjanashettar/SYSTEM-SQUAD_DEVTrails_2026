"""
Behavioral Fraud Detection
Detects anomalous claim patterns and suspicious behavior
"""

from datetime import datetime, timedelta
from collections import defaultdict

class BehavioralFraudDetector:
    """Detect fraud through behavior pattern analysis"""
    
    def __init__(self):
        self.thresholds = {
            'max_claims_per_week': 4,
            'max_daily_claims': 3,
            'min_hours_between_claims': 2,
            'unusual_claim_frequency': 3,  # >3 in 24h is suspicious
            'max_payout_ratio': 0.5  # Payout > 50% of monthly income
        }
    
    def analyze_claim_frequency(self, worker_id, current_timestamp, recent_claims):
        """
        Detect if worker is making too many claims too frequently
        
        Args:
            worker_id: Worker ID
            current_timestamp: Current datetime
            recent_claims: List of recent claim objects with 'timestamp' field
        
        Returns:
            fraud_score (0-1)
        """
        if not recent_claims:
            return 0.0
        
        try:
            current_dt = datetime.fromisoformat(str(current_timestamp)) if isinstance(current_timestamp, str) else current_timestamp
            
            # Claims in past 30 days
            claims_30d = [
                c for c in recent_claims 
                if (current_dt - datetime.fromisoformat(str(c.get('timestamp')))).days <= 30
            ]
            
            # Check weekly frequency
            claims_7d = [
                c for c in claims_30d
                if (current_dt - datetime.fromisoformat(str(c.get('timestamp')))).days <= 7
            ]
            
            weekly_count = len(claims_7d)
            
            if weekly_count > self.thresholds['max_claims_per_week']:
                frequency_score = min(1.0, (weekly_count - self.thresholds['max_claims_per_week']) / 4)
            else:
                frequency_score = 0.0
            
            # Check daily frequency
            claims_1d = [
                c for c in claims_30d
                if (current_dt - datetime.fromisoformat(str(c.get('timestamp')))).days <= 1
            ]
            
            daily_count = len(claims_1d)
            
            if daily_count >= self.thresholds['unusual_claim_frequency']:
                daily_score = min(1.0, daily_count / 5)
            else:
                daily_score = 0.0
            
            return max(frequency_score, daily_score)
            
        except Exception as e:
            print(f"Error in claim frequency analysis: {e}")
            return 0.0
    
    def analyze_claim_amount_ratio(self, claim_amount, monthly_income):
        """
        Check if claim amount is unusually large vs. worker's income
        
        Returns:
            fraud_score (0-1)
        """
        if monthly_income <= 0:
            return 0.2  # Unknown earnings, slight risk
        
        try:
            claim_to_income_ratio = float(claim_amount) / float(monthly_income)
            
            if claim_to_income_ratio > self.thresholds['max_payout_ratio']:
                return min(1.0, claim_to_income_ratio * 0.8)
            
            return 0.0
            
        except Exception as e:
            print(f"Error in amount ratio analysis: {e}")
            return 0.0
    
    def analyze_temporal_pattern(self, worker_id, recent_claims):
        """
        Detect if claims are made at unusual times
        e.g., always during night hours, indicating fake claims
        
        Returns:
            fraud_score (0-1)
        """
        if not recent_claims or len(recent_claims) < 3:
            return 0.0
        
        try:
            claim_hours = []
            
            for claim in recent_claims[-10:]:  # Last 10 claims
                try:
                    ts = datetime.fromisoformat(str(claim.get('timestamp')))
                    claim_hours.append(ts.hour)
                except:
                    pass
            
            if not claim_hours:
                return 0.0
            
            # Check if most claims at same hour
            hour_distribution = defaultdict(int)
            for h in claim_hours:
                hour_distribution[h] += 1
            
            max_hour_count = max(hour_distribution.values())
            
            # If 70%+ of claims at same hour, suspicious
            if max_hour_count > len(claim_hours) * 0.7:
                return 0.7
            
            return 0.0
            
        except Exception as e:
            print(f"Error in temporal pattern analysis: {e}")
            return 0.0
    
    def analyze_time_gap_pattern(self, recent_claims):
        """
        Detect if claims always come within exact time intervals
        (indicator of automated/scripted fraud)
        
        Returns:
            fraud_score (0-1)
        """
        if not recent_claims or len(recent_claims) < 3:
            return 0.0
        
        try:
            time_gaps = []
            
            for i in range(1, min(len(recent_claims), 10)):
                ts1 = datetime.fromisoformat(str(recent_claims[i-1].get('timestamp')))
                ts2 = datetime.fromisoformat(str(recent_claims[i].get('timestamp')))
                gap_hours = (ts2 - ts1).total_seconds() / 3600
                time_gaps.append(gap_hours)
            
            if not time_gaps or len(time_gaps) < 2:
                return 0.0
            
            # Check if gaps are too uniform (within ±1 hour)
            avg_gap = sum(time_gaps) / len(time_gaps)
            variance = sum((g - avg_gap) ** 2 for g in time_gaps) / len(time_gaps)
            
            # Very low variance = suspicious pattern
            if variance < 1:  # Less than 1 hour variance
                return 0.6
            
            return 0.0
            
        except Exception as e:
            print(f"Error in time gap analysis: {e}")
            return 0.0
    
    def analyze_claim_amount_patterns(self, recent_claims):
        """
        Detect if claim amounts follow suspicious patterns
        e.g., always exactly ₹300, never varies
        
        Returns:
            fraud_score (0-1)
        """
        if not recent_claims or len(recent_claims) < 3:
            return 0.0
        
        try:
            amounts = []
            
            for claim in recent_claims[-10:]:  # Last 10 claims
                try:
                    amount = float(claim.get('claimAmount', 0))
                    amounts.append(amount)
                except:
                    pass
            
            if not amounts or len(amounts) < 2:
                return 0.0
            
            # Check if all amounts are identical
            if len(set(amounts)) == 1:  # All same amount
                return 0.7
            
            # Check if amounts follow repeating pattern (e.g., 250, 300, 250, 300)
            if len(amounts) >= 4:
                if amounts[0] == amounts[2] == amounts[4]:
                    return 0.5
            
            return 0.0
            
        except Exception as e:
            print(f"Error in amount pattern analysis: {e}")
            return 0.0
    
    def get_behavioral_score(self, worker_id, claim_data, worker_history):
        """
        Calculate aggregated behavioral fraud score
        
        Args:
            worker_id: Worker identifier
            claim_data: Current claim details
            worker_history: Worker's historical data including recent_claims, monthly_income
        
        Returns:
            fraud_score (0-1) between 0.0 (legitimate) and 1.0 (highly suspicious)
        """
        try:
            current_timestamp = claim_data.get('timestamp', datetime.now())
            claim_amount = claim_data.get('claimAmount', 0)
            recent_claims = worker_history.get('recent_claims', [])
            monthly_income = worker_history.get('monthly_income', 700 * 30)  # Default ₹21k/month
            
            # Calculate individual scores
            frequency_score = self.analyze_claim_frequency(
                worker_id,
                current_timestamp,
                recent_claims
            )
            
            amount_score = self.analyze_claim_amount_ratio(claim_amount, monthly_income)
            
            temporal_score = self.analyze_temporal_pattern(worker_id, recent_claims)
            
            time_gap_score = self.analyze_time_gap_pattern(recent_claims)
            
            amount_pattern_score = self.analyze_claim_amount_patterns(recent_claims)
            
            # Weighted average of all indicators
            final_score = (
                frequency_score * 0.30 +
                amount_score * 0.20 +
                temporal_score * 0.20 +
                time_gap_score * 0.15 +
                amount_pattern_score * 0.15
            )
            
            return {
                'behavioral_score': round(min(1.0, final_score), 3),
                'components': {
                    'frequency': round(frequency_score, 3),
                    'amount_ratio': round(amount_score, 3),
                    'temporal': round(temporal_score, 3),
                    'time_gap': round(time_gap_score, 3),
                    'amount_pattern': round(amount_pattern_score, 3)
                }
            }
            
        except Exception as e:
            print(f"Error calculating behavioral score: {e}")
            return {
                'behavioral_score': 0.0,
                'components': {}
            }


if __name__ == "__main__":
    detector = BehavioralFraudDetector()
    
    # Test data
    worker_history = {
        'recent_claims': [
            {'timestamp': (datetime.now() - timedelta(days=1)).isoformat(), 'claimAmount': 300},
            {'timestamp': (datetime.now() - timedelta(days=0.5)).isoformat(), 'claimAmount': 300},
            {'timestamp': datetime.now().isoformat(), 'claimAmount': 300}
        ],
        'monthly_income': 21000
    }
    
    claim_data = {
        'timestamp': datetime.now().isoformat(),
        'claimAmount': 300
    }
    
    result = detector.get_behavioral_score('WORKER_001', claim_data, worker_history)
    
    print("Behavioral Fraud Analysis:")
    print(f"Final Score: {result['behavioral_score']}")
    print(f"Components: {result['components']}")
