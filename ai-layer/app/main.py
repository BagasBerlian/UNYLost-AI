from fastapi import FastAPI
from app.routers import image_matcher

app = FastAPI()
app.include_router(image_matcher.router)