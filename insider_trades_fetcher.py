import sqlite3
import json
from datetime import datetime

def fetch_insider_trades():

    try:
        # Load insider trades JSON
        with open("insider_trades.json", "r") as file:
            trades = json.load(file)

        conn = sqlite3.connect("stock_data.db")
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS insider_trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            action TEXT,
            client_name TEXT,
            security_name TEXT,
            quantity INTEGER,
            price REAL,
            date TEXT
        )
        """)

        # Insert trades
        for trade in trades:
            cursor.execute("""
            INSERT INTO insider_trades (symbol, action, client_name, security_name, quantity, price, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                trade["symbol"],
                trade["action"],
                trade["client_name"],
                trade["security_name"],
                trade["quantity"],
                trade["price"],
                datetime.now().strftime("%d-%b-%Y")   # auto current date
            ))

        conn.commit()
        conn.close()

        print("Insider trades stored in database successfully")

    except Exception as e:
        print("Error fetching insider trades:", e)


if __name__ == "__main__":
    fetch_insider_trades()