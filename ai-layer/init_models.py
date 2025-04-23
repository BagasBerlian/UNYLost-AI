import os
import pickle
import torch
import torchvision.models as models
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from PIL import Image
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pastikan direktori yang dibutuhkan ada
def ensure_directories_exist():
    os.makedirs("app/models", exist_ok=True)
    os.makedirs("app/embeddings", exist_ok=True)
    os.makedirs("temp_images", exist_ok=True)
    logger.info("Direktori yang dibutuhkan telah dibuat/diverifikasi")

# Inisialisasi model ResNet50
def init_resnet():
    logger.info("Menginisialisasi model ResNet50...")
    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Menggunakan device: {device}")
        
        # Load model ResNet50
        resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        resnet.eval()
        # Hapus layer terakhir
        resnet = torch.nn.Sequential(*list(resnet.children())[:-1])
        resnet.to(device)
        
        # Simpan model ke file untuk penggunaan offline (opsional)
        torch.save(resnet.state_dict(), "app/models/resnet50_feature_extractor.pth")
        logger.info("Model ResNet50 berhasil diinisialisasi dan disimpan")
        
        # Generate contoh embedding untuk verifikasi
        # Buat gambar kosong untuk testing
        dummy_image = Image.new('RGB', (224, 224), color = 'white')
        from app.services.image_encoder import extract_features
        dummy_embedding = extract_features(dummy_image)
        logger.info(f"Verifikasi extrak fitur: shape={dummy_embedding.shape}")
        
        return True
    except Exception as e:
        logger.error(f"Error inisialisasi ResNet50: {str(e)}")
        return False

# Inisialisasi TF-IDF Vectorizer
def init_tfidf_vectorizer():
    logger.info("Menginisialisasi TF-IDF Vectorizer...")
    try:
        # Stopwords Bahasa Indonesia
        stopwords_id = [
            'yang', 'dan', 'di', 'ke', 'pada', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
            'atau', 'juga', 'dari', 'akan', 'tidak', 'telah', 'dalam', 'secara', 'sehingga',
            'oleh', 'saya', 'kamu', 'dia', 'mereka', 'kami', 'kita', 'ada', 'bisa', 'dapat',
            'sudah', 'belum', 'jika', 'kalau', 'namun', 'tetapi', 'maka', 'sebagai', 'karena'
        ]
        
        # Buat vectorizer dengan parameter dasar
        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=10000,
            min_df=1,
            max_df=0.9,
            stop_words=stopwords_id
        )
        
        # Latih dengan beberapa contoh dokumen untuk inisialisasi
        sample_docs = [
            "dompet hitam berisi kartu mahasiswa",
            "laptop asus warna silver dengan stiker",
            "kunci motor honda dengan gantungan",
            "buku catatan berwarna merah",
            "kacamata hitam dengan case",
            "jam tangan digital warna hitam",
            "flashdisk sandisk warna biru",
            "kartu tanda mahasiswa atas nama",
            "handphone samsung warna hitam"
        ]
        
        vectorizer.fit(sample_docs)
        
        # Simpan vectorizer
        with open("app/models/tfidf_vectorizer.pkl", "wb") as f:
            pickle.dump(vectorizer, f)
        
        # Verifikasi dengan ekstrak fitur
        sample_features = vectorizer.transform(["dompet hitam berisi KTM"])
        logger.info(f"Verifikasi TF-IDF: shape={sample_features.shape}")
        logger.info("TF-IDF Vectorizer berhasil diinisialisasi dan disimpan")
        
        return True
    except Exception as e:
        logger.error(f"Error inisialisasi TF-IDF Vectorizer: {str(e)}")
        return False

# Fungsi utama untuk inisialisasi semua model
def init_all_models():
    ensure_directories_exist()
    resnet_success = init_resnet()
    tfidf_success = init_tfidf_vectorizer()
    
    if resnet_success and tfidf_success:
        logger.info("Semua model berhasil diinisialisasi")
        return True
    else:
        logger.error("Ada error dalam inisialisasi model")
        return False

if __name__ == "__main__":
    # Jalankan inisialisasi
    init_all_models()