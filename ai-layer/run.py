import uvicorn
import os
import sys
from datetime import datetime

def check_models():
    # Memeriksa keberadaan model AI
    print("Memeriksa model AI...")
    need_init = False
    if not os.path.exists("app/models/resnet50_feature_extractor.pth"):
        print("Model ResNet50 tidak ditemukan. Perlu menjalankan init_models.py")
        need_init = True
    if not os.path.exists("app/models/tfidf_vectorizer.pkl"):
        print("Model TF-IDF Vectorizer tidak ditemukan. Perlu menjalankan init_models.py")
        need_init = True
        
    if need_init:
        print("\nJalankan perintah berikut terlebih dahulu:")
        print("python init_models.py")
        sys.exit(1)

def main():
    """Fungsi utama untuk menjalankan server"""
    # Buat direktori yang diperlukan
    os.makedirs("temp_images", exist_ok=True)
    os.makedirs("app/embeddings", exist_ok=True)
    os.makedirs("app/models", exist_ok=True)
    
    # Cek model AI
    check_models()
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🚀 Menjalankan UNYLost AI Layer...")
    print("API Docs tersedia di: http://localhost:8000/docs")
    
    # Jalankan server FastAPI
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()