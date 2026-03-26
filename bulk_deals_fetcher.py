import sqlite3
import json
from datetime import datetime

def fetch_bulk_deals():
    try:
        # Load bulk deals JSON
        with open("insider_trades.json", "r") as file:
            deals = json.load(file)

        conn = sqlite3.connect("stock_data.db")
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bulk_deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            action TEXT,
            quantity INTEGER,
            price REAL,
            date TEXT
        )
        """)

        # Insert deals
        for deal in deals:
            cursor.execute("""
                INSERT INTO bulk_deals (symbol, action, quantity, price, date)
                VALUES (?, ?, ?, ?, ?)
            """, (
                deal["symbol"],
                deal["action"],
                deal["quantity"],
                deal["price"],
                datetime.now().strftime("%d-%b-%Y")   # auto current date
            ))

        conn.commit()
        conn.close()

        print("Bulk deals stored in database successfully!")

    except Exception as e:
        print("Error fetching bulk deals:", e)


if __name__ == "__main__":
    fetch_bulk_deals()