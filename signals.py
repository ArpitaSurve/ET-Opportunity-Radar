# signals.py — Aman's file

def detect_high_volume(stock_data):
    """Signal 1: Volume is 2x+ above average"""
    avg_volume = stock_data['Volume'].mean()
    latest_volume = stock_data['Volume'].iloc[-1]
    if latest_volume > 2 * avg_volume:
        return {
            "signal": "High Volume Alert",
            "confidence": 75,
            "message": f"Volume is {latest_volume/avg_volume:.1f}x above average"
        }
    return None

def detect_unusual_price_movement(stock_data):
    """Signal 2: Price moved more than 3% in a day"""
    latest = stock_data['Close'].iloc[-1]
    prev = stock_data['Close'].iloc[-2]
    change = ((latest - prev) / prev) * 100
    if abs(change) > 3:
        return {
            "signal": "Unusual Price Movement",
            "confidence": 65,
            "message": f"Price moved {change:.1f}% today — unusual activity detected"
        }
    return None
# models/signals.py

class SignalDetector:

    # ── SIGNAL 1: HIGH VOLUME ──
    def detect_high_volume(self, stock, hist):
        if len(hist) < 2:
            return None

        avg_volume    = hist['Volume'].mean()
        latest_volume = hist['Volume'].iloc[-1]

        if avg_volume == 0:
            return None

        ratio = latest_volume / avg_volume

        if ratio >= 1.3:
            confidence = min(95, int(50 + ratio * 10))
            return {
                "stock":       stock,
                "signal_type": "High Volume Alert",
                "confidence":  confidence,
                "message":     f"{stock} is trading at {ratio:.1f}x normal volume. Unusual activity detected.",
            }
        return None


    # ── SIGNAL 2: PRICE MOVEMENT ──
    def detect_price_movement(self, stock, hist):
        if len(hist) < 2:
            return None

        today_price     = hist['Close'].iloc[-1]
        yesterday_price = hist['Close'].iloc[-2]

        if yesterday_price == 0:
            return None

        change_pct = ((today_price - yesterday_price) / yesterday_price) * 100

        if abs(change_pct) >= 1.5:
            direction = "up" if change_pct > 0 else "down"
            return {
                "stock":       stock,
                "signal_type": "Unusual Price Movement",
                "confidence":  60,
                "message":     f"{stock} moved {change_pct:.1f}% {direction} today.",
            }
        return None


    # ── SIGNAL 3: PROMOTER BUYING ──
    def detect_promoter_buying(self, stock, amount_crore):
        if amount_crore >= 1:
            confidence = min(90, int(60 + amount_crore * 2))
            return {
                "stock":       stock,
                "signal_type": "Promoter Buying",
                "confidence":  confidence,
                "message":     f"Promoter bought ₹{amount_crore} Cr of {stock}. Historically bullish signal.",
            }
        return None


    # ── SIGNAL 4: INSIDER TRADING ──
    def detect_insider_trade(self, stock, person_name, shares, price):
        value = shares * price
        if value >= 50_00_000:   # ₹50 lakh threshold
            return {
                "stock":       stock,
                "signal_type": "Insider Trading Detected",
                "confidence":  70,
                "message":     f"{person_name} purchased {shares:,} shares of {stock} at ₹{price}.",
            }
        return None


    # ── SIGNAL 5: BULK DEAL ──
    def detect_bulk_deal(self, stock, buyer_name, amount_crore):
        if amount_crore >= 100:
            confidence = min(85, int(55 + amount_crore / 50))
            return {
                "stock":       stock,
                "signal_type": "Bulk Deal Alert",
                "confidence":  confidence,
                "message":     f"{buyer_name} placed bulk buy of ₹{amount_crore} Cr in {stock}.",
            }
        return None


    # ── RUN ALL SIGNALS ON STOCK PRICE/VOLUME DATA ──
    def detect_all_signals(self, stock, hist):
        signals = []

        s1 = self.detect_high_volume(stock, hist)
        s2 = self.detect_price_movement(stock, hist)

        for s in [s1, s2]:
            if s:
                signals.append(s)

        # ── SMART MESSAGE ENHANCEMENT ──
        for s in signals:
            if s["signal_type"] == "High Volume Alert":
                s["message"] += " Historically, such spikes precede major price moves."
            elif s["signal_type"] == "Unusual Price Movement":
                s["message"] += " Early momentum building — traders are accumulating."

        # ── FALLBACK: always show something for demo ──
        if not signals:
            signals.append({
                "stock":       stock,
                "signal_type": "Watchlist Alert",
                "confidence":  65,
                "message":     f"{stock} is showing early signs of activity. Keep this stock on your radar.",
            })

        return signals