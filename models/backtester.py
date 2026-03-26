import pandas as pd

class Backtester:

    def test_price_movement(self, hist):
        results = []

        for i in range(len(hist) - 5):
            today = hist.iloc[i]
            future = hist.iloc[i + 5]

            change_pct = ((future['Close'] - today['Close']) / today['Close']) * 100

            results.append(change_pct > 2)  # success if >2%

        if len(results) == 0:
            return 0

        accuracy = sum(results) / len(results) * 100
        return round(accuracy, 2)