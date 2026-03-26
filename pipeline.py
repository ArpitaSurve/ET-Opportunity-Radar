import time
from bulk_deals_fetcher import fetch_bulk_deals
from insider_trades_fetcher import fetch_insider_trades


def run_pipeline():

    print("Starting pipeline...")

    try:
        fetch_bulk_deals()
        print("Bulk deals updated")

        fetch_insider_trades()
        print("Insider trades updated")

    except Exception as e:
        print("Pipeline error:", e)


if __name__ == "__main__":

    while True:

        run_pipeline()

        print("Next update in 15 minutes...")

        time.sleep(900)