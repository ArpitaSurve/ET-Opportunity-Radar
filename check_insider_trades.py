import sqlite3

# Connect to the database
conn = sqlite3.connect("et_opportunity.db")
cursor = conn.cursor()

# Fetch all rows from insider_trades
cursor.execute("SELECT * FROM insider_trades")
rows = cursor.fetchall()

# Print the result
print("Insider Trades Table Content:")
print(rows)

# Close connection
conn.close()