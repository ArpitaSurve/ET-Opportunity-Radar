def calculate_signal(action, volume_spike=False, price_change=0):

    score = 0

    # Bulk deal action
    if action == "BUY":
        score += 30
    elif action == "SELL":
        score -= 30

    # Volume spike condition
    if volume_spike:
        score += 15

    # Price movement condition
    if price_change > 2:
        score += 20
    elif price_change < -2:
        score -= 20

    # Convert score to decision
    if score >= 70:
        decision = "BUY"
        confidence = 90
    elif score >= 50:
        decision = "WATCH"
        confidence = 70
    else:
        decision = "AVOID"
        confidence = 40

    return decision, confidence