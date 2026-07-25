from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import pandas as pd
import joblib
import os
from dataset_upload import load_dataset
import numpy as np

router = APIRouter(prefix="/predictionAPI")

os.makedirs("models", exist_ok=True)

MODEL_PATHS = {
    "class_model": "models/classification_model.joblib",
    "reg_model": "models/Regression_model.joblib",
    "k_model": "models/Kmeans_model.joblib",
    "pca_model": "models/PCA_model.joblib",
    "pre_model": "models/preprocessor_model.joblib",
}


def _safe_load(path):
    """Load a joblib artifact if it exists yet; otherwise return None instead
    of crashing. Models only exist after /recomendtion/rec has been run at
    least once, which isn't the case on a fresh deploy."""
    try:
        return joblib.load(path)
    except FileNotFoundError:
        return None


def _load_models():
    """Load fresh from disk on every call (not once at import) so a model
    trained via /recomendtion/rec after the server started is picked up
    immediately, without requiring a restart."""
    return {name: _safe_load(path) for name, path in MODEL_PATHS.items()}


def _require_models(*models):
    if any(m is None for m in models):
        raise HTTPException(
            status_code=503,
            detail="No trained model found yet. Run the ML Recommendation step "
                   "(/recomendtion/rec) on a dataset first, then try again.",
        )


class PredictionRequest(BaseModel):
    input: str

@router.post("/single_predict")
def single_predict(input: str = Form(...), file: UploadFile = File(...)):
    m = _load_models()
    pre_model, reg_model, class_model, k_model = m["pre_model"], m["reg_model"], m["class_model"], m["k_model"]
    _require_models(pre_model)
    # read uploaded CSV file into a DataFrame
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    target_column = input
    if target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{target_column}' not found in uploaded file",
        )

    feature_df = df[[target_column]]
    try:
        new_data = pre_model.transform(feature_df)
    except AttributeError:
        new_data = pre_model(feature_df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")

    new_df = pd.DataFrame(new_data, index=feature_df.index)

    try:
        if pd.api.types.is_numeric_dtype(df[target_column]):
            _require_models(reg_model)
            predictions = reg_model.predict(new_df)
        elif (pd.api.types.is_string_dtype(df[target_column]) or df[target_column].dtype == object) and df[target_column].nunique() <= 20:
            _require_models(class_model)
            predictions = class_model.predict(new_df)
        else:
            _require_models(k_model)
            predictions = k_model.predict(new_df)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {e}. The model may have been trained on a "
                   "different feature set than what was just preprocessed here — "
                   "try re-running /recomendtion/rec on this dataset first.",
        )

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "predictions": predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions),
    }
@router.post("/batch_predict")
def multiple_predict(file: UploadFile = File(...)):
    m = _load_models()
    pre_model, reg_model, class_model, k_model = m["pre_model"], m["reg_model"], m["class_model"], m["k_model"]
    _require_models(pre_model, reg_model, class_model, k_model)
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    try:
        proc_data = pre_model.transform(df)
    except AttributeError:
        try:
            proc_data = pre_model(df)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")

    try:
        df["regression_prediction"] = reg_model.predict(proc_data)
        df["classification_prediction"] = class_model.predict(proc_data)
        df["pca_prediction"] = k_model.predict(proc_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {e}. This usually means the regression, "
                   "classification, and clustering models were trained on different "
                   "feature sets (different target columns) — try re-running "
                   "/recomendtion/rec for all three against the same dataset.",
        )
    return {
        "records": df.to_dict(orient="records")
    }