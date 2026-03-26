import sqlite3

conn = sqlite3.connect("stock_data.db")
cursor = conn.cursor()

# Create bulk deals table
cursor.execute("""
CREATE TABLE IF NOT EXISTS bulk_deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock TEXT,
    action TEXT,
    quantity INTEGER,
    price REAL,
    date TEXT
)
""")

# Create insider trades table
cursor.execute("""
CREATE TABLE IF NOT EXISTS insider_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock TEXT,
    action TEXT,
    quantity INTEGER,
    price REAL,
    date TEXT
)
""")

conn.commit()
conn.close()

print("Database and tables created successfully!")