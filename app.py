import threading
import time
from pipeline import fetch_bulk_deals  # your function that updates DB

def auto_update():
    while True:
        fetch_bulk_deals()  # read JSON & insert into DB
        time.sleep(900)     # wait 15 minutes

threading.Thread(target=auto_update, daemon=True).start()
from flask import Flask, jsonify
import sqlite3
import pandas as pd
import yfinance as yf
from signals import SignalDetector  # Aman's signals.py
app = Flask(__name__)
DATABASE = "stock_data.db"

detector = SignalDetector()

# ---------- Helper functions ----------
def get_bulk_deals(stock):
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query("SELECT * FROM bulk_deals WHERE symbol = ?", conn, params=(stock,))
    conn.close()
    return df

def get_insider_trades(stock):
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query("SELECT * FROM insider_trades WHERE symbol = ?", conn, params=(stock,))
    conn.close()
    return df

def get_price_data(stock):
    # Try yfinance first
    try:
        data = yf.download(stock + ".NS", period="1mo", interval="1d")
        if not data.empty:
            latest = data.iloc[-1]
            return {
                "open": float(latest["Open"]),
                "close": float(latest["Close"]),
                "high": float(latest["High"]),
                "low": float(latest["Low"]),
                "volume": int(latest["Volume"])
            }
    except:
        pass

    # Fallback: try DB JSON values
    bulk_df = get_bulk_deals(stock)
    if not bulk_df.empty:
        latest = bulk_df.iloc[-1]
        return {
            "open": latest["price"],
            "close": latest["price"],
            "high": latest["price"],
            "low": latest["price"],
            "volume": latest["quantity"]
        }

    insider_df = get_insider_trades(stock)
    if not insider_df.empty:
        latest = insider_df.iloc[-1]
        return {
            "open": latest["price"],
            "close": latest["price"],
            "high": latest["price"],
            "low": latest["price"],
            "volume": latest["quantity"]
        }

    return None  # No data found

# ---------- API endpoints ----------
@app.route('/api/bulk-deals')
def bulk_deals():
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query("SELECT * FROM bulk_deals", conn)
    conn.close()
    return jsonify(df.to_dict(orient="records"))

@app.route('/api/insider-trades')
def insider_trades():
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query("SELECT * FROM insider_trades", conn)
    conn.close()
    return jsonify(df.to_dict(orient="records"))

@app.route('/api/stock-data/<stock>')
def stock_data(stock):
    data = get_price_data(stock)
    if data:
        return jsonify({"stock": stock, **data})
    return jsonify({"error": "No stock data found"})

@app.route('/api/opportunity/<stock>')
def opportunity(stock):
    price_data = get_price_data(stock)
    if not price_data:
        return jsonify({"stock": stock, "error": "No stock data found"})

    # Convert price_data to pandas DataFrame for SignalDetector
    hist_df = pd.DataFrame([{
        "Open": price_data["open"],
        "Close": price_data["close"],
        "High": price_data["high"],
        "Low": price_data["low"],
        "Volume": price_data["volume"]
    }])

    # Detect signals using Aman's detector
    signals = detector.detect_all_signals(stock, hist_df)

    # Score logic
    score = 0
    for s in signals:
        if "High Volume" in s["signal_type"]:
            score += 30
        elif "Unusual Price Movement" in s["signal_type"]:
            score += 20
        elif "Promoter Buying" in s["signal_type"]:
            score += 25
        elif "Insider Trading" in s["signal_type"]:
            score += 25
        elif "Bulk Deal" in s["signal_type"]:
            score += 30

    # Decision
    if score >= 70:
        decision = "BUY"
        confidence = min(95, score)
    elif score >= 50:
        decision = "WATCH"
        confidence = min(80, score)
    else:
        decision = "AVOID"
        confidence = min(60, score)

    return jsonify({
        "stock": stock,
        "decision": decision,
        "confidence": confidence,
        "score": score,
        "signals": signals
    })

if __name__ == '__main__':
    app.run(debug=True)