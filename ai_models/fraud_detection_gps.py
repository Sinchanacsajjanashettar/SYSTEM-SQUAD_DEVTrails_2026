"""
GPS Spoofing Detection Module
Detects impossible travel patterns and location anomalies
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt

class GPSSpoofingDetector:
    """Detect GPS spoofing by analyzing delivery location patterns"""
    
    def __init__(self, max_speed_kmh=120, teleport_threshold_km=100):
        """
        Args:
            max_speed_kmh: Maximum realistic speed (km/h)
            teleport_threshold_km: Distance threshold triggering alert
        """
        self.max_speed_kmh = max_speed_kmh
        self.teleport_threshold_km = teleport_threshold_km
    
    def haversine_distance(self, loc1, loc2):
        """
        Calculate distance in km between two coordinates (lat, lon)
        Using Haversine formula
        """
        lat1, lon1 = loc1
        lat2, lon2 = loc2
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        
        return km
    
    def check_impossible_travel(self, worker_id, claim_location, worker_history):
        """
        Check if worker traveled impossibly fast between last 2 deliveries
        
        Args:
            worker_id: Worker identifier
            claim_location: (lat, lon) of current claim location
            worker_history: List of past delivery locations with timestamps
        
        Returns:
            {
                'is_spoofed': bool,
                'fraud_score': 0.0-1.0,
                'reason': str,
                'details': dict
            }
        """
        if not worker_history or len(worker_history) < 1:
            return {
                'is_spoofed': False,
                'fraud_score': 0.0,
                'reason': 'insufficient_history',
                'worker_id': worker_id
            }
        
        try:
            # Get last delivery location and time
            last_delivery = worker_history[-1]
            last_location = (
                float(last_delivery.get('latitude', 0)),
                float(last_delivery.get('longitude', 0))
            )
            last_timestamp = datetime.fromisoformat(str(last_delivery.get('completed_at', datetime.now())))
            claim_timestamp = datetime.now()
            
            # Calculate distance and time
            distance_km = self.haversine_distance(last_location, claim_location)
            time_seconds = (claim_timestamp - last_timestamp).total_seconds()
            time_hours = max(time_seconds / 3600, 1/60)  # Minimum 1 minute
            
            required_speed = distance_km / time_hours
            
            # Check if speed is impossible
            if required_speed > self.max_speed_kmh:
                fraud_score = min(1.0, (required_speed - self.max_speed_kmh) / (self.max_speed_kmh * 2))
                is_spoofed = distance_km > self.teleport_threshold_km
                
                return {
                    'is_spoofed': is_spoofed,
                    'fraud_score': round(float(fraud_score), 3),
                    'reason': 'impossible_travel_speed',
                    'worker_id': worker_id,
                    'details': {
                        'required_speed_kmh': round(required_speed, 2),
                        'max_realistic_speed': self.max_speed_kmh,
                        'distance_km': round(distance_km, 2),
                        'time_hours': round(time_hours, 4),
                        'last_location': last_location,
                        'claim_location': claim_location
                    }
                }
            
            return {
                'is_spoofed': False,
                'fraud_score': 0.0,
                'reason': 'speed_within_limits',
                'worker_id': worker_id,
                'details': {
                    'required_speed_kmh': round(required_speed, 2),
                    'max_realistic_speed': self.max_speed_kmh,
                    'distance_km': round(distance_km, 2)
                }
            }
            
        except Exception as e:
            return {
                'is_spoofed': False,
                'fraud_score': 0.0,
                'reason': f'error_in_calculation: {str(e)}',
                'worker_id': worker_id
            }
    
    def check_location_consistency(self, worker_id, claim_location, typical_service_radius_km=10):
        """
        Check if claim location is within worker's typical delivery zone
        
        Returns:
            fraud_score between 0.0 (legitimate) and 1.0 (suspicious)
        """
        # This would query worker_history from database
        # For now: placeholder logic - would need real historical data
        
        return {
            'fraud_score': 0.0,
            'reason': 'location_in_service_zone',
            'confidence': 0.0
        }


if __name__ == "__main__":
    # Test the detector
    detector = GPSSpoofingDetector(max_speed_kmh=120, teleport_threshold_km=100)
    
    # Test case 1: Impossible travel (teleportation)
    worker_history = [
        {
            'latitude': 12.9716,
            'longitude': 77.5946,
            'completed_at': '2026-04-14T10:00:00'
        }
    ]
    
    claim_location = (14.5994, 78.0855)  # Different city ~250km away
    result = detector.check_impossible_travel(
        'WORKER_001',
        claim_location,
        worker_history
    )
    
    print("Test 1 - Impossible Travel:")
    print(f"Fraud Score: {result['fraud_score']}")
    print(f"Is Spoofed: {result['is_spoofed']}")
    print(f"Details: {result['details']}\n")
    
    # Test case 2: Normal travel
    claim_location_normal = (13.0350, 77.5950)  # ~10km away
    result2 = detector.check_impossible_travel(
        'WORKER_001',
        claim_location_normal,
        worker_history
    )
    
    print("Test 2 - Normal Travel:")
    print(f"Fraud Score: {result2['fraud_score']}")
    print(f"Is Spoofed: {result2['is_spoofed']}")
