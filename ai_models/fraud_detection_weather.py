"""
Weather Claim Validator
Validates weather-based claims against historical data
"""

import pandas as pd
from datetime import datetime, timedelta
import os

class WeatherClaimValidator:
    """Validate weather-based claims against historical data"""
    
    def __init__(self):
        self.historical_data = self._load_historical_weather()
        self.aqi_thresholds = {
            'good': (0, 50),
            'satisfactory': (51, 100),
            'mildly_polluted': (101, 200),
            'poor': (201, 300),
            'very_poor': (301, 400),
            'severe': (401, 500)
        }
    
    def _load_historical_weather(self):
        """Load weather dataset from CSV"""
        try:
            csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'weather_dataset.csv')
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                return df
            else:
                print(f"Warning: Weather dataset not found at {csv_path}")
                return pd.DataFrame()
        except Exception as e:
            print(f"Error loading weather data: {e}")
            return pd.DataFrame()
    
    def validate_rainfall_claim(self, claim_data):
        """
        Validate if rainfall actually occurred at claimed location/time
        
        Args:
            claim_data: {
                'location': 'Bangalore',
                'timestamp': '2026-04-14T14:30:00',
                'latitude': 12.9716,
                'longitude': 77.5946
            }
        
        Returns:
            {
                'is_valid': bool,
                'fraud_score': 0.0-1.0,
                'evidence': dict
            }
        """
        try:
            claim_time = datetime.fromisoformat(str(claim_data.get('timestamp', datetime.now())))
            location = claim_data.get('location', '')
            
            # Check historical data for this date/location
            if self.historical_data.empty:
                return {
                    'is_valid': True,  # No data to contradict
                    'fraud_score': 0.1,  # Slight uncertainty
                    'evidence': {
                        'reason': 'no_historical_data',
                        'checked_date': claim_time.strftime('%Y-%m-%d %H:%M'),
                        'checked_location': location,
                        'confidence': 0.3
                    }
                }
            
            # Look for matching weather records
            date_str = claim_time.strftime('%Y-%m-%d')
            
            # Case-insensitive search in 'city' or 'location' columns
            matching_records = self.historical_data[
                (self.historical_data['date'].astype(str).str.contains(date_str, na=False)) &
                (self.historical_data['city'].astype(str).str.contains(location, case=False, na=False))
            ]
            
            if len(matching_records) > 0:
                record = matching_records.iloc[0]
                rainfall = float(record.get('rainfall', 0))
                
                if rainfall > 0:
                    return {
                        'is_valid': True,
                        'fraud_score': 0.05,  # Very low fraud risk
                        'evidence': {
                            'reason': 'rainfall_confirmed',
                            'rainfall_mm': round(rainfall, 2),
                            'timestamp': str(record.get('timestamp')),
                            'confidence': 0.95,
                            'severity': 'high' if rainfall > 50 else 'medium' if rainfall > 10 else 'low'
                        }
                    }
                else:
                    return {
                        'is_valid': False,
                        'fraud_score': 0.85,  # High fraud risk - no rainfall recorded
                        'evidence': {
                            'reason': 'no_rainfall_recorded',
                            'rainfall_mm': 0,
                            'timestamp': date_str,
                            'confidence': 0.90,
                            'location_checked': location
                        }
                    }
            
            # No matching record found
            return {
                'is_valid': False,
                'fraud_score': 0.6,  # Medium fraud risk - data inconsistency
                'evidence': {
                    'reason': 'no_weather_data_match',
                    'checked_date': date_str,
                    'checked_location': location,
                    'confidence': 0.5
                }
            }
            
        except Exception as e:
            return {
                'is_valid': True,  # Fail open
                'fraud_score': 0.2,
                'evidence': {
                    'reason': f'validation_error: {str(e)}',
                    'confidence': 0.0
                }
            }
    
    def validate_pollution_claim(self, claim_data):
        """
        Validate if pollution/AQI spike occurred at claimed location/time
        
        Args:
            claim_data: {
                'location': 'Delhi',
                'timestamp': '2026-04-14T14:30:00',
                'aqi_threshold': 350
            }
        
        Returns:
            {
                'is_valid': bool,
                'fraud_score': 0.0-1.0,
                'evidence': dict
            }
        """
        try:
            claim_time = datetime.fromisoformat(str(claim_data.get('timestamp', datetime.now())))
            location = claim_data.get('location', '')
            aqi_threshold = claim_data.get('aqi_threshold', 350)
            
            if self.historical_data.empty:
                return {
                    'is_valid': True,
                    'fraud_score': 0.1,
                    'evidence': {
                        'reason': 'no_historical_data',
                        'confidence': 0.3
                    }
                }
            
            date_str = claim_time.strftime('%Y-%m-%d')
            
            # Search for matching AQI records
            matching_records = self.historical_data[
                (self.historical_data['date'].astype(str).str.contains(date_str, na=False)) &
                (self.historical_data['city'].astype(str).str.contains(location, case=False, na=False))
            ]
            
            if len(matching_records) > 0:
                record = matching_records.iloc[0]
                aqi = float(record.get('aqi', 0))
                
                if aqi >= aqi_threshold:
                    return {
                        'is_valid': True,
                        'fraud_score': 0.05,
                        'evidence': {
                            'reason': 'pollution_spike_confirmed',
                            'aqi': round(aqi, 0),
                            'threshold': aqi_threshold,
                            'category': self._get_aqi_category(aqi),
                            'confidence': 0.95
                        }
                    }
                else:
                    return {
                        'is_valid': False,
                        'fraud_score': 0.75,
                        'evidence': {
                            'reason': 'aqi_below_threshold',
                            'aqi_recorded': round(aqi, 0),
                            'threshold_expected': aqi_threshold,
                            'confidence': 0.90
                        }
                    }
            
            return {
                'is_valid': False,
                'fraud_score': 0.5,
                'evidence': {
                    'reason': 'no_aqi_data_match',
                    'checked_date': date_str,
                    'checked_location': location,
                    'confidence': 0.5
                }
            }
            
        except Exception as e:
            return {
                'is_valid': True,
                'fraud_score': 0.1,
                'evidence': {
                    'reason': f'validation_error: {str(e)}',
                    'confidence': 0.0
                }
            }
    
    def validate_heat_claim(self, claim_data):
        """
        Validate extreme heat claim
        
        Args:
            claim_data: {
                'location': 'Delhi',
                'timestamp': '2026-04-14T14:30:00',
                'temp_threshold': 45
            }
        """
        try:
            claim_time = datetime.fromisoformat(str(claim_data.get('timestamp', datetime.now())))
            location = claim_data.get('location', '')
            temp_threshold = claim_data.get('temp_threshold', 45)
            
            if self.historical_data.empty:
                return {
                    'is_valid': True,
                    'fraud_score': 0.1,
                    'evidence': {'reason': 'no_historical_data', 'confidence': 0.3}
                }
            
            date_str = claim_time.strftime('%Y-%m-%d')
            
            matching_records = self.historical_data[
                (self.historical_data['date'].astype(str).str.contains(date_str, na=False)) &
                (self.historical_data['city'].astype(str).str.contains(location, case=False, na=False))
            ]
            
            if len(matching_records) > 0:
                record = matching_records.iloc[0]
                max_temp = float(record.get('max_temp', 0))
                
                if max_temp >= temp_threshold:
                    return {
                        'is_valid': True,
                        'fraud_score': 0.05,
                        'evidence': {
                            'reason': 'extreme_heat_confirmed',
                            'max_temp': round(max_temp, 1),
                            'threshold': temp_threshold,
                            'confidence': 0.95
                        }
                    }
                else:
                    return {
                        'is_valid': False,
                        'fraud_score': 0.7,
                        'evidence': {
                            'reason': 'temp_below_threshold',
                            'max_temp_recorded': round(max_temp, 1),
                            'threshold_expected': temp_threshold,
                            'confidence': 0.90
                        }
                    }
            
            return {
                'is_valid': False,
                'fraud_score': 0.5,
                'evidence': {'reason': 'no_temp_data_match', 'confidence': 0.5}
            }
            
        except Exception as e:
            return {
                'is_valid': True,
                'fraud_score': 0.1,
                'evidence': {'reason': f'error: {str(e)}', 'confidence': 0.0}
            }
    
    def _get_aqi_category(self, aqi):
        """Get AQI category label"""
        for category, (min_val, max_val) in self.aqi_thresholds.items():
            if min_val <= aqi <= max_val:
                return category
        return 'severe'


if __name__ == "__main__":
    validator = WeatherClaimValidator()
    
    # Test rainfall claim
    test_claim = {
        'location': 'Bangalore',
        'timestamp': '2026-04-14T14:30:00',
        'latitude': 12.9716,
        'longitude': 77.5946
    }
    
    result = validator.validate_rainfall_claim(test_claim)
    print("Rainfall Claim Validation:")
    print(f"Valid: {result['is_valid']}")
    print(f"Fraud Score: {result['fraud_score']}")
    print(f"Evidence: {result['evidence']}\n")
