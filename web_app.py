"""
web_app.py

Serves the dashboard UI for the existing IBDE FastAPI backend.

This file is intentionally separate from the ML/API modules — it only
renders HTML pages and serves static assets. It does not define, rename,
or modify any of the project's existing data/ML endpoints. The pages
themselves call the existing routers (/dataset upload, /preprocessing,
/recomendtion, /predictionAPI, /summary, /documentation) directly from
the browser via static/js/*.js.
"""
import os
from fastapi import APIRouter, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

frontend_router = APIRouter()

PAGES = {
    "/app": ("home.html", "home"),
    "/app/upload": ("upload.html", "upload"),
    "/app/profiling": ("profiling.html", "profiling"),
    "/app/preprocessing": ("preprocessing.html", "preprocessing"),
    "/app/recommend": ("recommend.html", "recommend"),
    "/app/predict": ("predict.html", "predict"),
    "/app/visualize": ("visualize.html", "visualize"),
    "/app/validate": ("validate.html", "validate"),
    "/app/about": ("about.html", "about"),
}


def _make_page_route(template_name: str, active: str):
    def _route(request: Request):
        return templates.TemplateResponse(
            request=request,
            name=template_name,
            context={"active": active},
        )
    return _route


for path, (template_name, active) in PAGES.items():
    frontend_router.add_api_route(
        path,
        _make_page_route(template_name, active),
        methods=["GET"],
        include_in_schema=False,
    )


def mount_frontend(app):
    """Attach the dashboard UI (pages + static assets) to an existing FastAPI app."""
    app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
    app.include_router(frontend_router)
