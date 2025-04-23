from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import image_matcher, text_matcher, hybrid_matcher
import os

os.makedirs("app/models", exist_ok=True)
os.makedirs("app/embeddings", exist_ok=True)
os.makedirs("temp_images", exist_ok=True)

app = FastAPI(
    title="UNYLost AI API",
    description="API untuk mencari barang hilang dan temuan dengan AI",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dalam produksi, ganti dengan domain yang diizinkan
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_matcher.router)
app.include_router(text_matcher.router)
app.include_router(hybrid_matcher.router)

@app.get("/")
async def root():
    return {
        "app": "UNYLost AI API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "image_matching": "/image-matcher/match",
            "found_item_add": "/image-matcher/add-found-item",
            "text_matching": "/text-matcher/match",
            "text_search": "/text-matcher/search",
            "hybrid_matching": "/hybrid-matcher/match",
            "hybrid_search": "/hybrid-matcher/search"
        }
    }