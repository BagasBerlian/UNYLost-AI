from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers dengan penanganan error
try:
    from app.routers import image_matcher
    has_image_matcher = True
except ImportError:
    has_image_matcher = False
    print("⚠️ Peringatan: Modul image_matcher tidak ditemukan")

# Inisialisasi FastAPI
app = FastAPI(
    title="UNYLost AI Layer",
    description="API untuk layanan pencocokan barang hilang dan temuan",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ubah ini di production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers jika ada
if has_image_matcher:
    app.include_router(image_matcher.router)
else:
    print("⚠️ Router image_matcher tidak ditambahkan karena modul tidak ditemukan")

@app.get("/")
async def root():
    return {
        "message": "UNYLost AI Layer API berhasil berjalan",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2025-04-22T16:35:00"
    }