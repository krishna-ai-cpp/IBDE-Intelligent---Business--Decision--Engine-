from fastapi import File,UploadFile,HTTPException,FastAPI
import os
from fastapi import APIRouter
import pandas as pd
import joblib

router = APIRouter(prefix= "/dataset upload")
d_folder = "dataset"
os.makedirs(d_folder, exist_ok=True)


def load_dataset(path: str) -> pd.DataFrame:
    """Load a CSV dataset from disk. Returns an empty DataFrame if the
    file does not exist or cannot be read, so callers can just check
    `df.empty` as they already do throughout the project."""
    try:
        if not path or not os.path.exists(path):
            return pd.DataFrame()
        return pd.read_csv(path)
    except Exception:
        return pd.DataFrame()


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=404, detail= "enter a valid csv file...")
        content = await file.read()
        if not content:
            raise HTTPException(status_code=404,detail="No content found....")
        path = os.path.join(d_folder,file.filename)
        with open(path,"wb") as f:
            f.write(content)
        joblib.dump(path,"models/dataset_path.joblib")
        df = pd.read_csv(path)
        return{
            "Filename: " : file.filename,
            "No. of rows: " : df.shape[0],
            "No. of columns: " : df.shape[1],
            "Columns name: " : df.columns.to_list(),
            "Data types: " : df.dtypes.astype(str).to_list(),
            "Message: " : "File uploaded successfully...."
        }
    except HTTPException:
        raise
    except ValueError as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=400, detail=f"Could not parse CSV file: {e}")
