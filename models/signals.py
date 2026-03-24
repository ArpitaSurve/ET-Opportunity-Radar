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