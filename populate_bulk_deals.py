import sqlite3
import json

# Sample bulk deals data (replace this with your fetched JSON if you have it)
bulk_deals_json = [
    {
        "action": "BUY",
        "client_name": "ARIHANT CAPITAL MARKETS LIMITED",
        "date": "24-MAR-2026",
        "price": 305.29,
        "quantity": 865468,
        "security_name": "Agi Infra Limited",
        "symbol": "AGIIL"
    },
    {
        "action": "BUY",
        "client_name": "AFFLUENCE GEMS PRIVATE LIMITED",
        "date": "24-MAR-2026",
        "price": 22.11,
        "quantity": 700000,
        "security_name": "Atal Realtech Limited",
        "symbol": "ATALREAL"
    },
    {
        "action": "BUY",
        "client_name": "JUMP TRADING FINANCIAL INDIA PRIVATE LIMITED",
        "date": "24-MAR-2026",
        "price": 251.87,
        "quantity": 2601293,
        "security_name": "BLS Intl Servs Ltd",
        "symbol": "BLS"
    }
]

# Connect to database
conn = sqlite3.connect("et_opportunity.db")
cursor = conn.cursor()

# Create table if not exists (matching column names)
cursor.execute("""
CREATE TABLE IF NOT EXISTS bulk_deals (
    action TEXT,
    client_name TEXT,
    date TEXT,
    price REAL,
    quantity INTEGER,
    security_name TEXT,
    symbol TEXT
)
""")

# Insert each deal
for deal in bulk_deals_json:
    cursor.execute("""
    INSERT INTO bulk_deals (action, client_name, date, price, quantity, security_name, symbol)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        deal["action"],
        deal["client_name"],
        deal["date"],
        deal["price"],
        deal["quantity"],
        deal["security_name"],
        deal["symbol"]
    ))

conn.commit()
conn.close()

print("Bulk deals table populated successfully!")