from fastapi import FastAPI
# NOTE: data_profiling.py was not included in the project files, so this
# import is disabled to prevent a startup crash (ModuleNotFoundError).
# Re-enable the two lines below once data_profiling.py exists.
# from data_profiling import router as profiling_router
from data_visualization import router as vis_router
from dataset_upload import router as data_router
from intelligent_recomendation import router as intelli_router
from predictionAPI import router as pred_router
from preprocessing import router as pre_router
from swagger_documentation import router as sw_router
from web_app import mount_frontend
app = FastAPI(
    title="Intelligent Business Decision Engine(IBDE)",
    version="1.0",
    description="A universal Machine Learning Platform"
)
# app.include_router(profiling_router)  # disabled until data_profiling.py exists
app.include_router(vis_router)
app.include_router(data_router)
app.include_router(intelli_router)
app.include_router(pre_router)
app.include_router(pred_router)
app.include_router(sw_router)
mount_frontend(app)  # dashboard UI, served at /app — does not touch any existing route

@app.get("/health")
def health():
    return {
        "Server": "Running",
        "API": "Healthy"
    }
@app.get("/")
def home():
    return {
        "Project": "Intelligent Business Decision Engine (IBDE)",
        "Status": "Running",
        "Version": "1.0"
    }
@app.get("/about")
def about():
    return {
        "Project": "IBDE",
        "Author": "Krishna",
        "Framework": "FastAPI",
        "Machine Learning": "Scikit-learn",
        "Version": "1.0"
    }
@app.get("/modules")
def modules():
    return {
        "Available APIs": {
            "Dataset Upload": "/upload",
            "Data Profiling": "/profile",
            "Preprocessing": "/preprocess",
            "Recommendation": "/recommend",
            "Prediction": "/predict",
            "Visualization": [
                "/summary",
                "/heatmap",
                "/distribution",
                "/scatter",
                "/ft_imp"
            ],
            "Validation": "/validation"
        }
    }