def detect_volume_spike(data):

    # extract the real volume column
    volume = data["Volume"]

    # if pandas returns dataframe (multi index), convert to series
    if hasattr(volume, "columns"):
        volume = volume.iloc[:,0]

    avg_volume = volume.mean()
    latest_volume = volume.iloc[-1]

    if latest_volume > 1.5 * avg_volume:
        return "Volume Spike Detected"
    else:
        return "No unusual activity"