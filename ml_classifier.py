class MLClassifier:

    def classify(self, signal):

        confidence = signal.get("confidence", 50)

        if confidence >= 80:
            return "BUY"

        elif confidence >= 60:
            return "WATCH"

        else:
            return "AVOID"