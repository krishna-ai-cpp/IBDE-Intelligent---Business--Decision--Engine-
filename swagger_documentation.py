from fastapi import APIRouter, HTTPException
import os
import joblib
import pandas as pd

router = APIRouter(prefix="/documentation")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
PLOTS_DIR = os.path.join(BASE_DIR, "plots")


def _artifact_path(folder: str, filename: str) -> str:
    return os.path.join(folder, filename)


def _safe_load(path):
    """Load a joblib artifact if it exists yet; otherwise return None instead
    of crashing the whole app at import time."""
    try:
        return joblib.load(path)
    except FileNotFoundError:
        return None


def _load_artifacts():
    """Load fresh from disk on every call (not once at import) so this
    validation page reflects models/plots generated after the server
    started, without requiring a restart."""
    return {
        "classification_model": _safe_load(_artifact_path(MODELS_DIR, "classification_model.joblib")),
        "regression_model": _safe_load(_artifact_path(MODELS_DIR, "Regression_model.joblib")),
        "kmeans_model": _safe_load(_artifact_path(MODELS_DIR, "Kmeans_model.joblib")),
        "pca_model": _safe_load(_artifact_path(MODELS_DIR, "PCA_model.joblib")),
        "preprocessor": _safe_load(_artifact_path(MODELS_DIR, "preprocessor_model.joblib")),
        "dataset": _safe_load(_artifact_path(MODELS_DIR, "dataset_path.joblib")),
        "heatmap": _safe_load(_artifact_path(PLOTS_DIR, "heatmap.joblib")),
        "scatter": _safe_load(_artifact_path(PLOTS_DIR, "scatter.joblib")),
        "distribution": _safe_load(_artifact_path(PLOTS_DIR, "distribution.joblib")),
    }


@router.get("/dataset")
def valid():
    try:
        path = _load_artifacts()["dataset"]
        if not isinstance(path, str) or not path.strip() or not os.path.exists(path):
            raise HTTPException(status_code=404, detail="No file exists....")

        df = pd.read_csv(path)
        if df.empty:
            raise HTTPException(status_code=404, detail="Nothing to read..")

        return {
            "status": "passed",
            "message": "Dataset",
            "rows": df.shape[0],
            "columns": df.shape[1],
            "column_name": df.columns.to_list(),
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
def m_valid():
    a = _load_artifacts()
    model = {
        "classification model": a["classification_model"],
        "regression model": a["regression_model"],
        "kmeans model": a["kmeans_model"],
        "pca model": a["pca_model"],
        "preprocessor model": a["preprocessor"],
    }
    res = {}

    for name, mod in model.items():
        if mod is None:
            res[name] = "Not found.."
        else:
            res[name] = "Model found..."

    return res


@router.get("/s_preprocess")
def p_valid():
    try:
        a = _load_artifacts()
        preprocessor = a["preprocessor"]
        classification_model = a["classification_model"]
        if preprocessor is None or classification_model is None:
            raise HTTPException(status_code=500, detail="Preprocessing or classification model is missing")

        sample = pd.DataFrame([[0, 0]], columns=["feature_1", "feature_2"])
        if hasattr(preprocessor, "feature_names_in_"):
            sample = pd.DataFrame(
                [[0] * len(preprocessor.feature_names_in_)],
                columns=list(preprocessor.feature_names_in_),
            )

        transformed = preprocessor.transform(sample)
        pred = classification_model.predict(transformed)

        return {
            "status": "passed",
            "message": "prediction pipeline is working",
            "sample_prediction": pred.tolist(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"prediction validation failed: {e}")


@router.get("/v_visual")
def v_valid():
    try:
        a = _load_artifacts()
        visuals = {
            "Heatmap: ": a["heatmap"],
            "scatter: ": a["scatter"],
            "distribution: ": a["distribution"],
        }
        res = {}
        for name, vis in visuals.items():
            if vis is None:
                res[name] = "No visuals found..."
            else:
                res[name] = "visuals Found...."
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visuals validation failed: {e}")

