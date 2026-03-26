import sqlite3

conn = sqlite3.connect("et_opportunity.db")
cursor = conn.cursor()

# Drop old bulk_deals table if exists
cursor.execute("DROP TABLE IF EXISTS bulk_deals;")
conn.commit()
conn.close()

print("Old bulk_deals table dropped successfully!")