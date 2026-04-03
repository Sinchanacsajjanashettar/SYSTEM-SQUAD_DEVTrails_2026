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

🏁 Conclusion
```

GigShield AI provides:

✔ Financial protection for gig workers
✔ AI-based risk prediction
✔ Automatic insurance triggers
✔ Instant UPI payouts

It modernizes insurance into a fully automated smart system for the gig economy.
```

