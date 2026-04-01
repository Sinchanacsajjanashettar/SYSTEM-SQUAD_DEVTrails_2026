import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# load dataset
data = pd.read_csv("data.csv")

# split input and output
X = data[["rain", "aqi", "flood", "working_hours", "daily_income"]]
y = data["premium"]

# create model
model = LinearRegression()

# train model
model.fit(X, y)

# save trained model
joblib.dump(model, "model.pkl")

print("✅ Model trained successfully")