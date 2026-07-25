from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import pandas as pd
import joblib
import os
from dataset_upload import load_dataset
from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

router = APIRouter(prefix = "/preprocessing")
class inp(BaseModel):
      input:str
@router.post("/preprocess")
def preprocess(file_name: str, input: inp):
      try:
            df = load_dataset(f"dataset/{file_name}")
            if df.empty:
                  raise HTTPException(status_code=404, detail="no dataset found..")
            if input.input not in df.columns:
                  raise HTTPException(status_code=404, detail="no input found in dataset..")
            x = df.drop(columns=[input.input])
            y = df[input.input]
            preprocessing = build_preprocessor(x)
            x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
            joblib.dump(x_train.columns.to_list(),"models/features.joblib")
            x_train_processed = preprocessing.fit_transform(x_train)
            x_test_processed = preprocessing.transform(x_test)
            processed_df = pd.DataFrame(preprocessing.transform(x))
            return {
                  "message": "preprocessing completed successfully...",
                  "rows": processed_df.shape[0],
                  "columns": processed_df.shape[1]
            }
      except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

def build_preprocessor(x):
      nc = x.select_dtypes(include=["float64", "int64"]).columns.to_list()
      cc = x.select_dtypes(include=["object", "category"]).columns.to_list()
      num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaling", StandardScaler())
      ])
      cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoding", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
      ])
      return ColumnTransformer([
            ("num", num_pipeline, nc),
            ("category", cat_pipeline, cc)
      ])

def preprocess_data(file_name, target):
      df = load_dataset(f"dataset/{file_name}")
      x = df.drop(columns=[target])
      y = df[target]

      preprocessing = build_preprocessor(x)
      x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )
      x_train = preprocessing.fit_transform(x_train)
      os.makedirs("models", exist_ok=True)
      joblib.dump(preprocessing, "models/preprocessor_model.joblib")
      x_test = preprocessing.transform(x_test)
      return x_train, x_test, y_train, y_test