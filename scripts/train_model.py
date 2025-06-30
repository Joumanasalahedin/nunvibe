from app.data.preprocess import ContentData
from app.core.config import FEEDBACK_CSV_PATH, LR_MODEL_PATH, CSV_PATH
from sklearn.linear_model import LogisticRegression
import joblib
import pandas as pd
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))


def main():
    if not os.path.exists(FEEDBACK_CSV_PATH) or os.path.getsize(FEEDBACK_CSV_PATH) == 0:
        print(
            f"No feedback data found at {FEEDBACK_CSV_PATH}. Skipping model training.")
        return

    # Load user feedback labels: track_uri and binary label (1=like, 0=dislike)
    feedback_df = pd.read_csv(FEEDBACK_CSV_PATH)

    if feedback_df.empty:
        print("Feedback data is empty. Skipping model training.")
        return

    # Build feature matrix for labeled tracks
    data = ContentData(CSV_PATH)
    uris = feedback_df['track_uri'].tolist()
    idxs = [data.track_uris.index(u) for u in uris if u in data.track_uris]

    if not idxs:
        print("No valid track URIs found in feedback data. Skipping model training.")
        return

    X = data.features[idxs]
    y = feedback_df['label'].iloc[:len(idxs)]

    # Train logistic regression model
    lr = LogisticRegression(max_iter=1000)
    lr.fit(X, y)

    # Serialize trained model
    joblib.dump(lr, LR_MODEL_PATH)
    print(f"Saved logistic regression model to {LR_MODEL_PATH}")


if __name__ == "__main__":
    main()
