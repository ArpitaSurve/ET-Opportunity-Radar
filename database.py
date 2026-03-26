import sqlite3

def create_db():

    conn = sqlite3.connect("market_data.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bulk_deals (
        date TEXT,
        symbol TEXT,
        security_name TEXT,
        client_name TEXT,
        action TEXT,
        quantity INTEGER,
        price REAL
    )
    """)

    conn.commit()
    conn.close()

    print("Database and table created successfully")

create_db()