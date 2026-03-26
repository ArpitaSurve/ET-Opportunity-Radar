import pandas as pd

def detect_volume_spike(data: pd.DataFrame) -> str:
    """
    Detect unusual volume spike in the last 5 days of stock data.
    Returns a string signal.
    """

    try:
        # Ensure data is not empty
        if data.empty:
            return "No data fetched"

        # Flatten MultiIndex if exists
        if isinstance(data.columns, pd.MultiIndex):
            # Pick the first 'Volume' column that matches
            volume_cols = [col for col in data.columns if 'Volume' in col]
            if not volume_cols:
                return "Volume column not found"
            volume = data[volume_cols[0]]
        else:
            if 'Volume' not in data.columns:
                return "Volume column not found"
            volume = data['Volume']

        # Convert to numeric
        volume = pd.to_numeric(volume, errors='coerce').dropna()

        if len(volume) < 2:
            return "Not enough volume data"

        latest_volume = volume.iloc[-1]
        avg_volume = volume.iloc[:-1].mean()

        if latest_volume > 2 * avg_volume:
            return "Volume spike detected"
        else:
            return "No unusual activity"

    except Exception as e:
        return f"Error: {str(e)}"