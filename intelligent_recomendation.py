import pandas as pd
import os
from preprocessing import preprocess_data,build_preprocessor
from fastapi import APIRouter, HTTPException
from dataset_upload import load_dataset
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.cluster import KMeans,DBSCAN,AgglomerativeClustering
from sklearn.metrics import silhouette_score, r2_score, precision_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error,davies_bouldin_score
from sklearn.decomposition import PCA
import joblib

router = APIRouter(prefix="/recomendtion")
os.makedirs("models", exist_ok=True)

@router.get("/rec")
def recomend(file_name: str, target: str | None = None):
    df = load_dataset(f"dataset/{file_name}")
    if df.empty:
        raise HTTPException(status_code=404, detail="no dataset found..")
    if target is None:
        x = df.select_dtypes(include=["number"])
        if x.empty:
            raise HTTPException(status_code=400, detail="no numeric features available for clustering")
        ctrm = build_preprocessor(x)
        xpr = ctrm.fit_transform(x)
        model_algorithms = {
            "DBSCAN": DBSCAN(eps=0.5, min_samples=5),
            "AgglomerativeClustering": AgglomerativeClustering(n_clusters=3)
        }
        results = {}
        best_name = None
        best_score = -1
        for name, mod in model_algorithms.items():
            labels = mod.fit_predict(xpr)
            score = None
            if len(set(labels)) > 1:
                score = silhouette_score(xpr, labels)
                if score > best_score:
                    best_score = score
                    best_name = name
            results[name] = {"labels": labels.tolist(), "silhouette_score": score}

        best_k = 3
        final = KMeans(n_clusters=best_k, random_state=42, n_init=10)
        pred = final.fit_predict(xpr)

        df["Kmeans prediction"] = pred
        pca = PCA(n_components=2)
        x_pca = pca.fit_transform(xpr)
        df["PCA_1"] = x_pca[:, 0]
        df["PCA_2"] = x_pca[:, 1]

        joblib.dump(final, "models/Kmeans_model.joblib")
        joblib.dump(ctrm, "models/preprocessor_model.joblib")
        joblib.dump(pca, "models/PCA_model.joblib")

        return {
            "BEST MODEL": best_name,
            "BEST SCORE": best_score,
            "Kmeans prediction": pred.tolist(),
            "silhouette score": best_score,
            "PCA prediction": x_pca.tolist(),
            "cluster_results": results
        }
    if target not in df.columns:
        raise HTTPException(status_code=404, detail="no input found in dataset..")

    x_train, x_test, y_train, y_test = preprocess_data(file_name, target)
    metrics = {
        "MSE": mean_squared_error,
        "MAE": mean_absolute_error,
        "RMSE": root_mean_squared_error,
        "R^2 SCORE": r2_score
    }

    if pd.api.types.is_numeric_dtype(df[target]):
        if df.shape[0] <= 100:
            model = LinearRegression()
        else:
            model = RandomForestRegressor(n_estimators=100, random_state=42)

        model.fit(x_train, y_train)
        joblib.dump(model,"models/Regression_model.joblib")
        pred = model.predict(x_test)
        results = {}
        for name, fn in metrics.items():
            results[name] = fn(y_test, pred)
        return results

    if (pd.api.types.is_string_dtype(df[target]) or df[target].dtype == object) and df[target].nunique() <= 20:
        models = {
            "Logistic Regression": LogisticRegression(random_state=42, max_iter=100),
            "Decision Tree": DecisionTreeClassifier(random_state=42),
            "Random Forest": RandomForestClassifier(random_state=42, n_estimators=100)
        }
        best_model_name = ""
        best_precision = 0
        best_model = None
        for name, model in models.items():
            model.fit(x_train, y_train)
            pred = model.predict(x_test)
            precision = precision_score(y_test, pred, average="weighted")
            if precision > best_precision:
                best_precision = precision
                best_model_name = name
                best_model = model
        if best_model is None:
            raise HTTPException(status_code=400, detail="classification training failed")
        joblib.dump(best_model,"models/classification_model.joblib")
        return {
            "Best Model": best_model_name,
            "precision": best_precision
        }

    raise HTTPException(status_code=400, detail="something went wrong....")

    