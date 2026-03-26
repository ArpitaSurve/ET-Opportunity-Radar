# models/data_fetcher.py

import pandas as pd
import os

DATA_FOLDER = "data/price"

def fetch_market_data():
    stock_files = {
        "HDFCBANK": "HDFCBANK.csv",
        "ICICIBANK": "ICICIBANK.csv",
        "INFY": "INFY.csv",
        "RELIANCE": "RELIANCE.csv",
        "TCS": "TCS.csv"
    }

    market_data = {}

    for stock, file_name in stock_files.items():
        file_path = os.path.join(DATA_FOLDER, file_name)

        try:
            df = pd.read_csv(file_path)

            # Clean column names
            df.columns = [col.strip() for col in df.columns]

            # Fix "Low Close" issue if exists
            if "Low Close" in df.columns:
                df[["Low", "Close"]] = df["Low Close"].str.split(" ", expand=True)
                df.drop(columns=["Low Close"], inplace=True)

            # Convert to numeric
            for col in ["Open", "High", "Low", "Close", "Volume"]:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")

            # Drop NaN rows
            df.dropna(inplace=True)

            market_data[stock] = df

        except Exception as e:
            print(f"Error loading {stock}: {e}")

    return market_data

def fetch_bulk_deals():
    try: 
        df = pd.read_csv("data/bulk_deals.csv")
        df.columns = [col.strip() for col in df.columns]
        return df
    except:
        return pd.DataFrame()  # Return empty DataFrame on error

# ── INSIDER TRADING ──
def fetch_insider_trading():
    try:
        df = pd.read_csv("data/insider_trading.csv")
        df.columns = [col.strip() for col in df.columns]
        return df
    except:
        return pd.DataFrame()


# ── PROMOTER BUYING ──
def fetch_promoter_buying():
    try:
        df = pd.read_csv("data/promoter_buying.csv")
        df.columns = [col.strip() for col in df.columns]
        return df
    except:
        return pd.DataFrame()