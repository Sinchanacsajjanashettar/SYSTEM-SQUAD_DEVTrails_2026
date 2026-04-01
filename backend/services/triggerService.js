/**
 * Multiple Automated Triggers for Claim Generation
 * These triggers identify income loss disruptions
 */

// Trigger 1: Heavy Rainfall (affects delivery workers)
exports.checkRainfallTrigger = (rainfall) => {
  const HEAVY_RAIN_THRESHOLD = 60; // mm
  return {
    triggered: rainfall > HEAVY_RAIN_THRESHOLD,
    trigger: 'HEAVY_RAINFALL',
    threshold: HEAVY_RAIN_THRESHOLD,
    value: rainfall,
    claimAmount: 300,
    coverage: 'Income Loss during Heavy Rain'
  };
};

// Trigger 2: Air Quality Index (AQI) - Pollution
exports.checkAQITrigger = (aqi) => {
  const SEVERE_POLLUTION_THRESHOLD = 350; // Very Unhealthy
  return {
    triggered: aqi > SEVERE_POLLUTION_THRESHOLD,
    trigger: 'SEVERE_POLLUTION',
    threshold: SEVERE_POLLUTION_THRESHOLD,
    value: aqi,
    claimAmount: 250,
    coverage: 'Income Loss due to Air Pollution'
  };
};

// Trigger 3: Extreme Heat (temperature)
exports.checkHeatTrigger = (temperature) => {
  const EXTREME_HEAT_THRESHOLD = 45; // Celsius
  return {
    triggered: temperature > EXTREME_HEAT_THRESHOLD,
    trigger: 'EXTREME_HEAT',
    threshold: EXTREME_HEAT_THRESHOLD,
    value: temperature,
    claimAmount: 200,
    coverage: 'Income Loss during Extreme Heat'
  };
};

// Trigger 4: Traffic/Road Disruption (severe congestion hours)
exports.checkTrafficTrigger = (congestionIndex) => {
  const SEVERE_CONGESTION_THRESHOLD = 8; // Scale 1-10
  return {
    triggered: congestionIndex > SEVERE_CONGESTION_THRESHOLD,
    trigger: 'SEVERE_CONGESTION',
    threshold: SEVERE_CONGESTION_THRESHOLD,
    value: congestionIndex,
    claimAmount: 150,
    coverage: 'Income Loss due to Traffic Disruption'
  };
};

// Trigger 5: Government Curfew/Lockdown Alert
exports.checkCurfewTrigger = (curfewActive) => {
  return {
    triggered: curfewActive === true,
    trigger: 'CURFEW_LOCKDOWN',
    threshold: 'Active',
    value: curfewActive,
    claimAmount: 500,
    coverage: 'Income Loss during Government Curfew'
  };
};

// Master function to check all triggers
exports.checkAllTriggers = (environmentData) => {
  const triggers = [];

  if (environmentData.rainfall !== undefined) {
    const rainTrigger = exports.checkRainfallTrigger(environmentData.rainfall);
    if (rainTrigger.triggered) triggers.push(rainTrigger);
  }

  if (environmentData.aqi !== undefined) {
    const aqiTrigger = exports.checkAQITrigger(environmentData.aqi);
    if (aqiTrigger.triggered) triggers.push(aqiTrigger);
  }

  if (environmentData.temperature !== undefined) {
    const heatTrigger = exports.checkHeatTrigger(environmentData.temperature);
    if (heatTrigger.triggered) triggers.push(heatTrigger);
  }

  if (environmentData.congestionIndex !== undefined) {
    const trafficTrigger = exports.checkTrafficTrigger(environmentData.congestionIndex);
    if (trafficTrigger.triggered) triggers.push(trafficTrigger);
  }

  if (environmentData.curfewActive !== undefined) {
    const curfewTrigger = exports.checkCurfewTrigger(environmentData.curfewActive);
    if (curfewTrigger.triggered) triggers.push(curfewTrigger);
  }

  return {
    anyTriggered: triggers.length > 0,
    activetriggers: triggers,
    totalClaimAmount: triggers.reduce((sum, t) => sum + t.claimAmount, 0)
  };
};