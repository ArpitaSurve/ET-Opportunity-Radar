from flask import Flask, jsonify, render_template
import yfinance as yf
import random

from models.data_fetcher import (
    fetch_market_data,
    fetch_bulk_deals,
    fetch_insider_trading,
    fetch_promoter_buying
)
from models.signals import SignalDetector
from models.backtester import Backtester
from models.ml_classifier import MLClassifier

app = Flask(__name__)

detector = SignalDetector()
backtester = Backtester()
ml = MLClassifier()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/signals')
def get_live_signals():
    market_data = fetch_market_data()
    bulk_df = fetch_bulk_deals()
    insider_df = fetch_insider_trading()
    promoter_df = fetch_promoter_buying()

    live_feed = []

    # ── PRICE + VOLUME SIGNALS ──
    for stock, hist in market_data.items():
        signals = detector.detect_all_signals(stock, hist)
        live_feed.extend(signals)

    # ── BULK DEALS ──
    for _, row in bulk_df.head(3).iterrows():
        try:
            if row['BUY/SELL'] == 'BUY':
                live_feed.append({
                    "stock": row['SYMBOL'],
                    "signal_type": "Bulk Deal Alert",
                    "confidence": random.randint(70, 85),
                    "message": f"{row['CLIENT NAME']} bought {row['SYMBOL']} — smart money entry."
                })
        except:
            continue

    # ── INSIDER TRADING ──
    for _, row in insider_df.head(3).iterrows():
        try:
            live_feed.append({
                "stock": row['SYMBOL'],
                "signal_type": "Insider Trading Detected",
                "confidence": random.randint(70, 85),
                "message": f"{row['PERSON']} bought shares of {row['SYMBOL']} — insider confidence rising."
            })
        except:
            continue

    # ── PROMOTER BUYING ──
    for _, row in promoter_df.head(2).iterrows():
        try:
            live_feed.append({
                "stock": row['SYMBOL'],
                "signal_type": "Promoter Buying",
                "confidence": random.randint(75, 90),
                "message": f"Promoter increased stake in {row['SYMBOL']} — strong bullish signal."
            })
        except:
            continue

    # ── REMOVE DUPLICATES (BEST SIGNAL PER STOCK) ──
    best_signals = {}

    priority = {
        "Promoter Buying": 5,
        "Bulk Deal Alert": 4,
        "Insider Trading Detected": 3,
        "High Volume Alert": 2,
        "Unusual Price Movement": 1,
        "Watchlist Alert": 0
    }

    for signal in live_feed:
        stock = signal["stock"]

        if stock not in best_signals:
            best_signals[stock] = signal
        else:
            current_priority = priority.get(signal["signal_type"], 0)
            existing_priority = priority.get(best_signals[stock]["signal_type"], 0)

            if current_priority > existing_priority:
                best_signals[stock] = signal

    final_output = list(best_signals.values())

    # ── ADD BACKTESTING + ML LAYER ──
    for signal in final_output:

        stock = signal["stock"]
        hist = market_data.get(stock)

        # Backtesting accuracy
        if hist is not None:
            accuracy = backtester.test_price_movement(hist)
            signal["backtest_accuracy"] = f"{accuracy}%"
        else:
            signal["backtest_accuracy"] = "N/A"

        # ML Decision
        signal["decision"] = ml.classify(signal)

    return jsonify(final_output)


@app.route('/api/market-status')
def get_market_status():
    try:
        nifty = yf.Ticker("^NSEI").history(period="1d")

        if not nifty.empty:
            current_price = nifty['Close'].iloc[-1]
            return jsonify({"nifty_50": round(current_price, 2)})

        return jsonify({"error": "Market data unavailable"})

    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True, port=5000)