import joblib
import sys
import os

# 🔥 FIX PATH
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "model.pkl")

model = joblib.load(model_path)

try:
    rain = float(sys.argv[1])
    aqi = float(sys.argv[2])
    flood = float(sys.argv[3])
    hours = float(sys.argv[4])
    income = float(sys.argv[5])

    result = model.predict([[rain, aqi, flood, hours, income]])

    print(result[0])
except Exception as e:
    print("ERROR:", e)