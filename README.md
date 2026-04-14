# GigShield AI - Smart Insurance for Gig Workers
### SYSTEM-SQUAD_DEVTrails_2026

“A smart platform that helps delivery workers get compensation when they cannot work due to weather, pollution, traffic, or other external problems.”

---

## 🚀 GigShield AI - AI Powered Parametric Insurance Platform

GigShield AI is an AI-powered parametric insurance system designed to protect gig delivery workers from income loss caused by external disruptions such as extreme weather, pollution, floods, curfews, traffic congestion, and government restrictions.

It automatically monitors real-world conditions and triggers compensation without manual claims.

---

## ❗ Problem Statement

Gig workers (Swiggy, Zomato, Amazon, Zepto) face income loss due to:

- Heavy rainfall  
- Flooded roads  
- Severe air pollution  
- Traffic congestion  
- Government curfews  

There is currently no automated insurance system that protects them instantly.

👉 GigShield AI solves this using AI-based risk analysis and automatic payouts.

---

## 👤 Target User

**Example:**

- Name: Rahul  
- Age: 26  
- Platform: Swiggy  
- Daily Income: ₹700  

During heavy rain:

- Orders reduce  
- Roads become unsafe  
- Income drops  

👉 GigShield automatically compensates lost income.

---

## 🔑 Key Features

### 1. Parametric Triggers (Auto Claims)

- 🌧️ Rain > 60mm → ₹300  
- 💨 AQI > 350 → ₹250  
- 🔥 Temperature > 45°C → ₹200  
- 🚗 Traffic > 8/10 → ₹150  
- ⛔ Curfew → ₹500  

---

### 2. AI Dynamic Pricing

Premium is calculated based on:

- Location risk  
- Weather history  
- Pollution levels  
- Flood probability  

**Example:**

- Low risk → ₹10/week  
- Medium risk → ₹20/week  
- High risk → ₹30/week  

---

### 3. Zero-Touch Claims System

Trigger Detected → Policy Verification → Fraud Check → Auto Approval → Instant UPI Payout  

---

### 4. Worker System

- Registration  
- UPI linking  
- Risk scoring  
- Claim history tracking  

---

## 🔄 Workflow

1. Worker registers  
2. System analyzes risk  
3. Policy is created  
4. Real-time monitoring starts  
5. Trigger activates on threshold  
6. Claim auto-approved  
7. Instant payout sent  

---

## 🛠️ Tech Stack

### Frontend:
- React.js  
- Tailwind CSS  

### Backend:
- Node.js  
- Express.js  

### AI/ML:
- Python  
- Scikit-learn  
- Pandas  

### Database:
- MongoDB  

### APIs:
- OpenWeatherMap  
- AQI API  

### Payments:
- UPI / Razorpay Sandbox  

---

## 🏗️ System Architecture

Worker → React App → Node.js Backend → AI Risk Engine → Fraud Detection → Monitoring System → Claim Engine → UPI Payment → MongoDB  

---

## 🧠 AI / ML Modules

- Premium prediction (Regression / Random Forest)  
- Fraud detection (Anomaly detection, GPS spoofing detection)  
- Disruption prediction (Weather forecasting models)  

---
## 📁 Repository Structure

```
GigShield-AI/
├── frontend/
├── backend/
├── ai-models/
├── data/
├── docs/
├── scripts/
└── README.md
```

---

## ⚙️ How to Run the Project (IMPORTANT)

```bash
# Clone the repository
git clone https://github.com/Sinchanacsajjanashettar/SYSTEM-SQUAD_DEVTrails_2026

# Go into project folder
cd SYSTEM-SQUAD_DEVTrails_2026

# Run Backend
cd backend
npm install
npm start

# Run Frontend
cd ../frontend
npm install
npm start
```


🔐 Environment Variables
```

Create a .env file in backend:
MONGO_URI=your_mongodb_connection
API_KEY=your_api_key
```

---
🎥Demo Video

https://www.youtube.com/watch?v=vJdbbHWPUjA
---
---

<<<<<<< HEAD
🏁 Conclusion
```
=======
## Security

- Password hashing
- Fraud detection system
- Duplicate claim prevention
- Input validation

---

## Phase 3 Enhancements (April 5-17, 2026)

### ✅ Advanced Fraud Detection
- **GPS Spoofing Detection**: Detect impossible travel patterns and location inconsistencies
- **Weather Claim Validation**: Cross-reference claims with historical weather data
- **Behavioral Anomaly Detection**: Identify suspicious claim patterns and frequencies
- **System Accuracy**: >85% fraud detection with <500ms latency

### ✅ Instant Payout System
- **Razorpay Integration**: Test mode payout gateway integrated
- **UPI Simulator**: Demo-ready payment simulation for live presentations
- **Payout Orchestration**: Claims approved → Payout initiated in <5 seconds
- **Payment History**: Workers can track all transactions and payouts

### ✅ Intelligent Dashboards

**For Workers:**
- 📊 Earnings Protected: Weekly coverage amount with safe zone discounts
- 📈 Coverage Summary: Selected hours, premium breakdown, active triggers
- 📋 Claim Timeline: All claims from past 30 days with amounts & status
- 🔮 Next Week Forecast: Predicted disruptions with recommendation
- 🛡️ Personal Safety Score: Location risk, fraud risk, historical claims

**For Insurers/Admins:**
- 💰 Portfolio Health: Active workers, total premiums, loss ratios
- 📊 Loss Analytics: Claims breakdown by type, regional trends
- 🤖 Fraud Dashboard: Flagged claims, workers under review, fraud rate
- 🌍 Predictive Analytics: Next week's weather/claims forecast with heatmaps
- ⚙️ Processing Pipeline: Real-time status of auto-approved, manual review, rejected claims

### ✅ Final Submission Package
- **5-Minute Demo Video**: Full walkthrough of registration, claims, payouts
- **20-Slide Pitch Deck**: Problem, solution, tech stack, business model, financials
- **Complete Documentation**: Architecture, fraud detection, payment integration guides

---

## Phase Development Timeline

| Phase | Duration | Status | Key Achievements |
|-------|----------|--------|------------------|
| **Phase 1** | Weeks 1-2 | ✅ Complete | Infrastructure, API setup, database |
| **Phase 2** | Weeks 3-4 | ✅ Complete | Core features, basic ML models, demo workflow |
| **Phase 3** | Weeks 5-6 | 🔄 In Progress | Fraud detection, payouts, dashboards, final submission |

---

## Documentation

- 📖 [PHASE_3_ROADMAP.md](PHASE_3_ROADMAP.md) - Complete Phase 3 requirements & timeline
- 🛠️ [PHASE_3_IMPLEMENTATION_GUIDE.md](PHASE_3_IMPLEMENTATION_GUIDE.md) - Code implementation guide with examples
- ✅ [PHASE_3_SUBMISSION_CHECKLIST.md](PHASE_3_SUBMISSION_CHECKLIST.md) - Final submission checklist & quick start
- 📚 [docs/architecture.md](docs/architecture.md) - System architecture overview
- 🔐 [docs/fraud_detection.md](docs/FRAUD_DETECTION.md) - Detailed fraud detection documentation
- 💳 [docs/payment_integration.md](docs/PAYMENT_INTEGRATION.md) - Payment gateway integration guide

---

## Future Enhancements

- Mobile app (React Native)
- WhatsApp alerts
- Blockchain verification
- Advanced AI prediction
- Multi-language support

---

## Conclusion
>>>>>>> b8714c1 (phase-3)

GigShield AI provides:

✔ Financial protection for gig workers
✔ AI-based risk prediction
✔ Automatic insurance triggers
✔ Instant UPI payouts

It modernizes insurance into a fully automated smart system for the gig economy.
```

