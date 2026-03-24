from flask import Flask, jsonify, render_template
import yfinance as yf
import pandas as pd

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/bulk-deals')
def get_bulk_deals():
    return jsonify({"message": "Bulk deals endpoint working"})

if __name__ == '__main__':
    app.run(debug=True)
