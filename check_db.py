import sqlite3

# Connect to the database
conn = sqlite3.connect("stock_data.db")
cursor = conn.cursor()

# Check bulk_deals table
cursor.execute("SELECT * FROM bulk_deals")
bulk_deals = cursor.fetchall()
print("Bulk Deals Table:")
for row in bulk_deals:
    print(row)

# Check insider_trades table
cursor.execute("SELECT * FROM insider_trades")
insider_trades = cursor.fetchall()
print("\nInsider Trades Table:")
for row in insider_trades:
    print(row)

conn.close()