from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import os
import uuid

router = APIRouter(prefix="/summary")
os.makedirs("plots", exist_ok=True)
os.makedirs("models", exist_ok=True)


def _safe_load(path):
    try:
        return joblib.load(path)
    except FileNotFoundError:
        return None


@router.post("/summary")
def summary(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=404, detail="Nothing to read...")
        df = pd.read_csv(file.file)
        if df.empty:
            raise HTTPException(status_code=404, detail="Nothing to read...")
        return {
            "No. of rows": df.shape[0],
            "No. of columns": df.shape[1],
            "No. of missing values": int(df.isnull().sum().sum()),
            "Data types": df.dtypes.astype(str).to_list()
        }
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Unexpected error occurred while reading the file.")

@router.post("/heatmap")
def heatmap(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=404, detail="Nothing to read...")
        df = pd.read_csv(file.file)
        if df.empty:
            raise HTTPException(status_code=404, detail="Nothing to read...")
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            raise HTTPException(status_code=404, detail="No numeric columns available for heatmap")
        corr = numeric_df.corr()
        if corr.empty:
            raise HTTPException(status_code=404, detail="No correlation data available")
        plt.figure(figsize=(10, 8))
        sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f")
        filename = f"heatmap_{uuid.uuid4().hex}.png"
        path = os.path.join(os.getcwd(), filename)
        plt.savefig(path, bbox_inches="tight")
        joblib.dump(path,"plots/heatmap.joblib")
        plt.close()
        return FileResponse(path, media_type="image/png")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Unexpected error occurred while generating heatmap.")
    
@router.post("/distribution")
def distribution(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=404, detail="Nothing to read...")
        df = pd.read_csv(file.file)
        if df.empty:
            raise HTTPException(status_code=404, detail="Nothing to read...")
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            raise HTTPException(status_code=404, detail="No numeric columns available for distribution")
        # pick the first numeric column for distribution plot
        c = numeric_df.columns[0]
        plt.figure(figsize=(10,7))
        plt.title(f"Distribution of {c}")
        sns.histplot(numeric_df[c], kde=True, bins=10, color="cyan")
        plt.grid(True)
        filename = f"Histplot_{uuid.uuid4().hex}.png"
        path = os.path.join(os.getcwd(),filename)
        plt.savefig(path, bbox_inches="tight")
        joblib.dump(path,"plots/distribution.joblib")
        plt.close()
        return FileResponse(path, media_type="image/png")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Unexpected error occurred while generating heatmap.")

@router.post("/scatter")
def scatter(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=404, detail="Nothing to read...")
        df = pd.read_csv(file.file)
        if df.empty:
            raise HTTPException(status_code=404, detail="Nothing to read...")
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.shape[1] < 2:
            raise HTTPException(status_code=404, detail="At least two numeric columns required for scatter plot")
        x_col, y_col = numeric_df.columns[0], numeric_df.columns[1]
        plt.figure(figsize=(10,7))
        plt.title(f"Scatter plot between {x_col} and {y_col}")
        sns.scatterplot(x=numeric_df[x_col], y=numeric_df[y_col], color="teal")
        plt.grid(True)
        filename = f"Scatterplot_{uuid.uuid4().hex}.png"
        path = os.path.join(os.getcwd(),filename)
        plt.savefig(path,bbox_inches="tight")
        joblib.dump(path,"plots/scatter.joblib")
        plt.close()
        return FileResponse(path, media_type="image/png")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Unexpected error occurred while generating scatterplot.")
@router.post("/ft_imp")
def ft_imp(file: UploadFile = File(...)):
    try:
        model = _safe_load("models/classification_model.joblib")
        features = _safe_load("models/features.joblib")
        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=404, detail="Nothing to read...")
        df = pd.read_csv(file.file)
        if df.empty:
            raise HTTPException(status_code=404, detail="Nothing to read...")
        if not hasattr(model, "feature_importances_"):
            raise HTTPException(status_code=400, detail="This model does not support feature_importances")
        imp = model.feature_importances_
        if not features or len(imp) != len(features):
            raise HTTPException(status_code=400, detail="Feature length mismatch with model importances")
        ft_df = pd.DataFrame({
            "Feature": features,
            "Importance": imp
        })
        new = ft_df.sort_values(by="Importance", ascending=False)
        return {"Feature importances": new.to_dict(orient="records")}
    except HTTPException:
        raise
    except ValueError as e:
        print(e)
        raise HTTPException(status_code=400, detail=f"Could not compute feature importances: {e}")
