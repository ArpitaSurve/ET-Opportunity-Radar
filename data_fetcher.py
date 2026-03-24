import yfinance as yf

stocks = [
"TATAMOTORS.NS",
"RELIANCE.NS",
"INFY.NS",
"HDFCBANK.NS",
"TCS.NS"
]

for stock in stocks:

    print("\nFetching data for:", stock)

    try:
        data = yf.download(stock, period="5d")

        if data.empty:
            print("No data found for", stock)
        else:
            print(data.tail())

    except Exception as e:
        print("Error fetching", stock, ":", e)