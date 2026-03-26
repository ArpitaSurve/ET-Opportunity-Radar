import sqlite3

conn = sqlite3.connect("et_opportunity.db")
cursor = conn.cursor()

# Create bulk_deals table if it doesn't exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS bulk_deals (
    Date TEXT,
    Symbol TEXT,
    Security_Name TEXT,
    Client_Name TEXT,
    Buy_Sell TEXT,
    Quantity_Traded INTEGER,
    Trade_Price REAL,
    Remarks TEXT
)
""")

conn.commit()
conn.close()

print("bulk_deals table created (if it didn't exist).")