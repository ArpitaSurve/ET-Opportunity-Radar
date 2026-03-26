import sqlite3

# Connect to your database
conn = sqlite3.connect("et_opportunity.db")
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in DB:", tables)

conn.close()