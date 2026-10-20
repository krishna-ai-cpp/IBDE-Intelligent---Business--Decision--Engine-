# IBDE · Intelligent Business Decision Engine

**A FastAPI project for exploring tabular data, selecting an ML workflow, and inspecting its results.**

IBDE connects CSV upload, preprocessing, regression/classification/clustering experiments, visualizations, and model-artifact checks. A Jinja2 dashboard sits alongside the API so the workflow can be explored through either a browser or Swagger documentation.

`Python` · `FastAPI` · `pandas` · `scikit-learn` · `Jinja2` · `JavaScript`

[Capabilities](#capabilities) · [Run locally](#run-locally) · [Source map](#source-map) · [Current limitations](#current-limitations)

## Capabilities

| Stage | Implementation |
| :--- | :--- |
| Upload | Read a CSV, save it locally, and return dataset dimensions and column details |
| Prepare | Impute missing values, scale numeric features, and encode supported categorical columns |
| Train | Regression or classification with a target; numeric clustering without a target |
| Inspect | Summary statistics, correlation heatmaps, distributions, scatter plots, and supported feature importances |
| Predict | Single/batch prediction endpoints, subject to the artifact compatibility limits below |
| Check | Dataset, saved-model, preprocessing, and visualization artifact checks |

### Model choices

- **Regression:** Linear Regression for datasets of at most 100 rows; Random Forest Regressor for larger datasets.
- **Classification:** Logistic Regression, Decision Tree, and Random Forest, compared by weighted precision for supported string targets.
- **Clustering:** DBSCAN and Agglomerative Clustering are compared; a separate KMeans model with `k=3` and a two-component PCA projection are saved.

The clustering comparison winner and the saved KMeans model are separate outputs.

## Public demo deployment

This application needs a running Python web service. GitHub Pages serves static websites and cannot run the FastAPI backend. The repository includes a [Render deployment configuration](render.yaml) for a free web service with a `/health` readiness check.

[Deploy this repository to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fkrishna-ai-cpp%2FIBDE-Intelligent---Business--Decision--Engine-)

The hosting account must be connected before a service can be created. A verified public demo URL has not been added yet. Once Render assigns the service's HTTPS address, the dashboard is at `/app`, the interactive API documentation is at `/docs`, and the health endpoint is at `/health` on that same public address.

The free service can sleep when idle, and generated datasets/models are not permanent storage. Use small, non-sensitive demo datasets. Run one training workflow at a time because model artifacts are shared.

## Run locally

**These are local development addresses, not a publicly hosted website.** `127.0.0.1` means the computer where your browser is running. Clicking a link below works only after IBDE has started on that computer; GitHub stores the source code and does not start the Python server for you.

From your **existing repository folder**, use Python 3.12; the checked-in `.python-version` specifies 3.12.3.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn final_integration:app --reload
```

Keep that terminal running while using the app. When the terminal reports that Uvicorn is running on port 8000, open the dashboard below.

### Windows launcher

Alternatively, double-click **`Start IBDE.cmd`** in the repository folder. On first use, it prepares the Python 3.12 environment if necessary, starts the server in the background, waits for it to respond, and opens the dashboard. Running it again reuses an existing IBDE server rather than starting a duplicate. Startup logs are stored locally in `.ibde/`. Double-click **`Stop IBDE.cmd`** to stop the server started by this launcher.

| Page | Local address |
| :--- | :--- |
| Dashboard | http://127.0.0.1:8000/app |
| Interactive API documentation | http://127.0.0.1:8000/docs |
| Health endpoint | http://127.0.0.1:8000/health |
| API metadata | http://127.0.0.1:8000/ |

If the browser says **site can't be reached**, run the launcher or start command first. If startup fails, inspect the terminal output or `.ibde/server-error.log`. After restarting Windows, start IBDE again. These addresses will not work on another person's PC unless they run their own copy; a separate public deployment is needed for an online demo.

### Suggested walkthrough

1. Open the dashboard and upload a small CSV with several numeric columns and enough rows for the selected workflow.
2. Open `/docs` to inspect the endpoint inputs and responses.
3. Train one workflow at a time through the recommendation page or `/recomendtion/rec`.
4. Inspect a heatmap, distribution, or scatter plot.
5. Use the validation page to inspect available dataset and model artifacts.

The exact route spellings, including `/dataset upload` and `/recomendtion`, are retained from the source. Swagger handles URL encoding for routes with spaces.

## Source map

| File or directory | Responsibility |
| :--- | :--- |
| [final_integration.py](final_integration.py) | Main FastAPI app, router registration, health and metadata routes |
| [web_app.py](web_app.py), [templates/](templates/), [static/](static/) | Dashboard pages and browser interactions |
| [dataset_upload.py](dataset_upload.py) | CSV upload and dataset loader |
| [preprocessing.py](preprocessing.py) | scikit-learn preprocessing helpers |
| [intelligent_recomendation.py](intelligent_recomendation.py) | Workflow selection, training, metrics, and artifact persistence |
| [predictionAPI.py](predictionAPI.py) | Prediction endpoints and model availability checks |
| [data_visualization.py](data_visualization.py) | Dataset summaries and chart generation |
| [swagger_documentation.py](swagger_documentation.py) | Artifact-validation endpoints |
| [requirements.txt](requirements.txt), [Procfile](Procfile), [render.yaml](render.yaml) | Dependency and deployment configuration |

`dataset/`, `models/`, and `plots/` are runtime folders. There is no database or account system in this application.

## Current limitations

- **Profiling:** `data_profiling.py` is absent and its router is disabled. The Profiling page and some advertised route names do not represent working endpoints in this checkout.
- **Prediction artifacts:** all workflow types share one preprocessor filename. Training another workflow can overwrite it with an incompatible feature schema. Single prediction can also supply columns different from those used in training. Prediction is not a reliable cross-workflow demonstration until artifacts are separated by model and schema.
- **Target selection:** numeric targets follow the regression path, including numerically encoded classes. String classification currently supports at most 20 distinct target values.
- **Small inputs:** three-cluster models and two-component PCA require suitable row counts and feature counts; not every CSV satisfies these requirements.
- **Evaluation:** model comparison uses a held-out split rather than nested validation. Metrics are dataset-specific, and no general accuracy is claimed.
- **Hosting:** local datasets and generated artifacts need explicit persistence for hosted use. A deployment configuration is included; a current live deployment is not asserted.

## Engineering discussion

This project separates the web pages from the data/ML routers and loads prediction artifacts when requested. The next architectural improvement is to persist a preprocessor, model, feature schema, and evaluation record together for each training run.

---

**Krishna Agrawal** · [Flask-based Decision Intelligence Platform](https://github.com/krishna-ai-cpp/Decision-Intelligence-Platform) · [Portfolio](https://github.com/krishna-ai-cpp)
