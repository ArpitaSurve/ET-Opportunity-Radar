import yfinance as yf
import pandas as pd
import os

# Create price folder if it doesn't exist
os.makedirs("data/price", exist_ok=True)

# List of stocks
stocks = ["RELIANCE.NS", "INFY.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS"]

for stock in stocks:
    print(f"Fetching data for {stock}...")
    df_price = yf.download(stock, period="2y")
    df_price.reset_index(inplace=True)
    
    # Create CSV file name without .NS
    file_name = stock.replace(".NS","") + ".csv"
    
    # Save CSV
    df_price.to_csv(f"data/price/{file_name}", index=False)
    print(f"{file_name} saved successfully!")

print("All 5 stock price datasets are ready!")