# ET Opportunity Radar 📡

> Real-Time Stock Signal Intelligence Platform for Indian Equity Markets

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.x-orange.svg)](https://flask.palletsprojects.com)
[![NSE](https://img.shields.io/badge/Data-NSE%20Live-green.svg)](https://nseindia.com)

---

## What is this?

ET Opportunity Radar aggregates live data from NSE, detects high-confidence trading signals using rule-based and ML models, and presents them through an interactive real-time dashboard.

It combines **insider activity**, **promoter buying**, **bulk deals**, and **price/volume signals** into a single unified feed — helping retail investors spot opportunities early.

---

## Features

- **Live Signal Feed** — filtered by Insider, Bulk Deal, Promoter, Volume
- **ML Decision Engine** — classifies each signal as BUY / SELL / WATCH
- **Backtesting Score** — historical accuracy shown on every signal card
- **Candlestick Charts** — interactive OHLCV charts via LightweightCharts
- **Auto-refresh** — live data updates every 30 seconds
- **NSE Market Status** — real-time IST clock + market open/closed badge
- **Watchlist, Ticker, Stats Bar** — full dashboard experience

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              DATA SOURCES                   │
│  NSE Live │ Bulk Deals │ Insider │ Promoter │
└────────────────────┬────────────────────────┘
                     │ yfinance + NSE scrapers
┌────────────────────▼────────────────────────┐
│             FLASK BACKEND (app.py)          │
│  data_fetcher → SignalDetector → Backtester │
│              → ML Classifier                │
│              → GET /api/signals             │
└────────────────────┬────────────────────────┘
                     │ fetch() JSON
┌────────────────────▼────────────────────────┐
│              FRONTEND                       │
│  Signal Feed │ Charts │ Stats │ Watchlist   │
│  index.html + style.css + script.js         │
└────────────────────┬────────────────────────┘
                     │
              User Browser
          http://127.0.0.1:5000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Framework | Flask (Python) |
| Market Data | yfinance |
| Data Processing | pandas |
| ML Model | scikit-learn |
| Charts | LightweightCharts v4.1.1 |
| Frontend | HTML5, CSS3, Vanilla JS |
| Fonts | Space Mono + Syne (Google Fonts) |

---

## Project Structure

```
ET-Opportunity-Radar/
├── app.py                  # Main Flask app + API routes
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Frontend HTML (Jinja2 template)
├── static/
|   ├──css
│   |   ├── style.css        # Stylesheet
│   └── js
|       ├── dashboard.js     # Frontend JavaScript
├── models/
│   ├── data_fetcher.py     # Fetches NSE market data
│   ├── signals.py          # SignalDetector class
│   ├── backtester.py       # Backtesting engine
│   └── ml_classifier.py   # ML model (BUY/SELL/WATCH)
└── data/                   # Cached / processed data
```

---

## Setup & Installation

### Prerequisites
- Python 3.8+
- pip
- Git

### 1. Clone the repo
```bash
git clone https://github.com/ArpitaSurve/ET-Opportunity-Radar.git
cd ET-Opportunity-Radar
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the app
```bash
python app.py
```

### 4. Open in browser
```
http://127.0.0.1:5000
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the main dashboard |
| `/api/signals` | GET | Returns live signal feed as JSON |
| `/api/market-status` | GET | Returns NIFTY 50 price |

### Sample Response — `/api/signals`

```json
[
  {
    "stock": "HDFCBANK",
    "signal_type": "Promoter Buying",
    "confidence": 78,
    "decision": "WATCH",
    "message": "Promoter increased stake in HDFCBANK — strong bullish signal.",
    "backtest_accuracy": "20.16%"
  }
]
```

---

## Signal Priority

| Signal Type | Priority | Description |
|-------------|----------|-------------|
| Promoter Buying | ⭐⭐⭐⭐⭐ | Strongest bullish indicator |
| Bulk Deal Alert | ⭐⭐⭐⭐ | Smart institutional money |
| Insider Trading | ⭐⭐⭐ | Company insiders buying |
| High Volume Alert | ⭐⭐ | Unusual volume spike |
| Unusual Price Move | ⭐ | Price breakout detected |
| Watchlist Alert | — | Early activity, monitor it |

---

## Disclaimer

> This platform is built for **educational and demonstration purposes only**. Signals, decisions, and accuracy scores do not constitute financial advice. Always do your own research before making investment decisions.

---

## Team

- **Backend** — Data pipeline, ML models, Flask API
- **Frontend** — Dashboard UI, charts, system integration

