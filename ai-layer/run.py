import argparse
import os
import sys
import logging
import uvicorn
import importlib.util
import subprocess

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("run")

def verify_environment():
    """Verifikasi environment dan dependensi"""
    logger.info("Memeriksa environment dan dependensi...")
    
    # Cek direktori yang dibutuhkan
    required_dirs = ["app", "firebase_key", "temp_images"]
    for directory in required_dirs:
        if not os.path.exists(directory):
            logger.error(f"Direktori {directory} tidak ditemukan, membuat direktori...")
            os.makedirs(directory, exist_ok=True)
    
    # Cek file konfigurasi Firebase
    if not os.path.exists("firebase_key/serviceAccountKey.json"):
        logger.error("Service account key tidak ditemukan di firebase_key/serviceAccountKey.json")
        logger.error("Harap download dari Firebase Console > Project Settings > Service Accounts")
        return False
    
    # Cek apakah model sudah diinisialisasi
    if not os.path.exists("app/models/tfidf_vectorizer.pkl"):
        logger.warning("TF-IDF Vectorizer belum diinisialisasi")
        
        # Cek apakah init_models.py ada
        if os.path.exists("init_models.py"):
            logger.info("Menjalankan init_models.py...")
            try:
                subprocess.run([sys.executable, "init_models.py"], check=True)
                logger.info("Inisialisasi model berhasil")
            except subprocess.CalledProcessError:
                logger.error("Inisialisasi model gagal")
                return False
        else:
            logger.error("File init_models.py tidak ditemukan")
            return False
    
    # Cek apakah app/main.py ada
    if not os.path.exists("app/main.py"):
        logger.error("File app/main.py tidak ditemukan")
        return False
    
    return True

def verify_required_modules():
    """Verifikasi modul-modul Python yang dibutuhkan"""
    required_modules = [
        "fastapi", "uvicorn", "torch", "torchvision", 
        "scikit-learn", "firebase_admin", "numpy", "PIL",
        "requests", "python-multipart", "google.auth"
    ]
    
    missing_modules = []
    for module in required_modules:
        try:
            if module == "PIL":
                # PIL diimpor sebagai pillow
                importlib.import_module("PIL")
            else:
                # Coba impor modul
                importlib.import_module(module.split(".")[0])
        except ImportError:
            missing_modules.append(module)
    
    if missing_modules:
        logger.error(f"Modul yang dibutuhkan belum terinstal: {', '.join(missing_modules)}")
        logger.error("Jalankan: pip install -r requirements.txt")
        return False
    
    return True

def run_app(host="127.0.0.1", port=8000, dev_mode=True):
    """Jalankan aplikasi FastAPI"""
    if not verify_environment() or not verify_required_modules():
        logger.error("Persiapan environment gagal, aplikasi tidak dapat dijalankan")
        return
    
    logger.info(f"Menjalankan aplikasi di {'development' if dev_mode else 'production'} mode")
    logger.info(f"Host: {host}, Port: {port}")
    
    if dev_mode:
        # Mode development dengan hot reload
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
    else:
        # Mode production tanpa hot reload
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            workers=4,
            log_level="warning"
        )

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Run UNYLost AI Layer')
    parser.add_argument('--host', type=str, default="127.0.0.1", help='Host to bind (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind (default: 8000)')
    parser.add_argument('--prod', action='store_true', help='Run in production mode')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run_app(host=args.host, port=args.port, dev_mode=not args.prod)