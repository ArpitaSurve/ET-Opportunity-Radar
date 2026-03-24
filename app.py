from flask import Flask, jsonify
import yfinance as yf
from signal_engine import detect_volume_spike

app = Flask(__name__)

@app.route('/api/opportunity/<stock>')
def get_opportunity(stock):

    data = yf.download(stock + ".NS", period="5d")

    signal = detect_volume_spike(data)

    return jsonify({
        "stock": stock,
        "signal": signal
    })

if __name__ == '__main__':
    app.run(debug=True)