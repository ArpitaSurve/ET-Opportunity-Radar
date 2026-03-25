from flask import Flask, jsonify, render_template
import yfinance as yf
from models.data_fetcher import (
    fetch_market_data,
    fetch_bulk_deals,
    fetch_insider_trading,
    fetch_promoter_buying
)
import random
from models.signals import SignalDetector

app = Flask(__name__)
detector = SignalDetector()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/signals')
def get_live_signals():
    market_data    = fetch_market_data()
    bulk_df        = fetch_bulk_deals()
    insider_df     = fetch_insider_trading()
    promoter_df    = fetch_promoter_buying()

    live_feed = []

    # ── PRICE + VOLUME SIGNALS (Signal 1 & 2) ──
    for stock, hist in market_data.items():
        signals = detector.detect_all_signals(stock, hist)
        live_feed.extend(signals)

    # ── BULK DEALS (Signal 4) ──
    for _, row in bulk_df.head(3).iterrows():
        try:
            if row['BUY/SELL'] == 'BUY':
                live_feed.append({
                    "stock":       row['SYMBOL'],
                    "signal_type": "Bulk Deal Alert",
                    "confidence":  random.randint(65,80),
                    "message":     f"{row['CLIENT NAME']} bought {row['SYMBOL']} — smart money entry."
                })
        except:
            continue

    # ── INSIDER TRADING (Signal 3) ──
    for _, row in insider_df.iterrows():
        try:
            live_feed.append({
                "stock":       row['SYMBOL'],
                "signal_type": "Insider Trading Detected",
                "confidence":  random.randint(65,80),
                "message":     f"{row['PERSON']} bought shares of {row['SYMBOL']} — insider confidence rising."
            })
        except:
            continue

    # ── PROMOTER BUYING (Signal 5) ──
    for _, row in promoter_df.head(2).iterrows():
        try:
            live_feed.append({
                "stock":       row['SYMBOL'],
                "signal_type": "Promoter Buying",
                "confidence":  random.randint(65,80),
                "message":     f"Promoter increased stake in {row['SYMBOL']} — strong bullish signal."
            })
        except:
            continue

    # ── KEEP BEST SIGNAL PER STOCK (remove duplicates) ──
    best_signals = {}
    for signal in live_feed:
        stock = signal["stock"]
        if stock not in best_signals:
            best_signals[stock] = signal
        priority = {
            "Promoter Buying": 3,
            "Bulk Deal Alert": 4,
            "Insider Trading Detected": 5,
            "High Volume Alert": 2,
            "Unusual Price Movement": 1,
            "Watchlist Alert": 0
        }

        if priority.get(signal["signal_type"], 0) > priority.get(best_signals[stock]["signal_type"], 0):
            best_signals[stock] = signal

    final_output = list(best_signals.values())
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
