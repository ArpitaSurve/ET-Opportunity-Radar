import pandas as pd

# Open RELIANCE.csv
df = pd.read_csv("data/price/RELIANCE.csv")

# Show first 5 rows
print(df.head())

# Optional: see column names
print(df.columns)