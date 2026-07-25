from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def health():
    return{
        "message: " : "your API is running...",
        "Health: ": "healthy"
    }
@app.get("/home")
def home():
    return{
        "Message: " : "You are currntly in home's tab",
        "Application: " : "IBDE -> Intelligent Business Decision Engine...",
        "Created by: ": "Krishna Agarwal"
            }
