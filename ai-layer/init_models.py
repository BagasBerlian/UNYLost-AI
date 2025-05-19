# pylint: disable=all
# type: ignore
# noqa

import os
import pickle
import torch
import torchvision.models as models
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from PIL import Image
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def ensure_directories_exist():
    os.makedirs("app/models", exist_ok=True)
    os.makedirs("app/embeddings", exist_ok=True)
    os.makedirs("temp_images", exist_ok=True)
    logger.info("Direktori yang dibutuhkan telah dibuat/diverifikasi")

def init_mobilenet():
    logger.info("Menginisialisasi model MobileNetV3-Small...")
    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Menggunakan device: {device}")
        
        mobilenet = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        mobilenet.eval()
        mobilenet = torch.nn.Sequential(*list(mobilenet.children())[:-1])
        mobilenet.to(device)
        
        torch.save(mobilenet.state_dict(), "app/models/mobilenet_v3_small_feature_extractor.pth")
        logger.info("Model MobileNetV3-Small berhasil diinisialisasi dan disimpan")
        
        dummy_image = Image.new('RGB', (224, 224), color='white')
        from app.services.image_encoder import extract_features
        dummy_embedding = extract_features(dummy_image)
        logger.info(f"Verifikasi ekstrak fitur: shape={dummy_embedding.shape}")
        
        return True
    except Exception as e:
        logger.error(f"Error inisialisasi MobileNetV3-Small: {str(e)}")
        return False

def init_tfidf_vectorizer():
    logger.info("Menginisialisasi TF-IDF Vectorizer...")
    try:
        stopwords_id = [
            'yang', 'dan', 'di', 'ke', 'pada', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
            'atau', 'juga', 'dari', 'akan', 'tidak', 'telah', 'dalam', 'secara', 'sehingga',
            'oleh', 'saya', 'kamu', 'dia', 'mereka', 'kami', 'kita', 'ada', 'bisa', 'dapat',
            'sudah', 'belum', 'jika', 'kalau', 'namun', 'tetapi', 'maka', 'sebagai', 'karena'
        ]
        
        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=10000,
            min_df=1,
            max_df=0.9,
            stop_words=stopwords_id
        )
        
        sample_docs = [
            "dompet hitam berisi kartu mahasiswa",
            "laptop asus warna silver dengan stiker",
            "kunci motor honda dengan gantungan",
            "buku catatan berwarna merah",
            "kacamata hitam dengan case",
            "jam tangan digital warna hitam",
            "flashdisk sandisk warna biru",
            "kartu tanda mahasiswa atas nama",
            "handphone samsung warna hitam",
            "airpods dengan case putih",
            "tablet ipad warna silver",
            "jaket hoodie warna navy",
            "helm motor berwarna hitam",
            "sepatu sneakers putih nike",
            "botol minum tupperware biru",
            "payung lipat warna hitam merek",
            "charger laptop lenovo hitam",
            "headphone bluetooth warna putih",
            "kalung silver dengan liontin",
            "gelang tangan emas",
            "tas selempang hitam adidas",
            "koper travel warna merah",
            "powerbank xiaomi 10000mah",
            "mouse logitech wireless",
            "keyboard mechanical dengan lampu rgb"
        ]
        
        vectorizer.fit(sample_docs)
        
        with open("app/models/tfidf_vectorizer.pkl", "wb") as f:
            pickle.dump(vectorizer, f)
        
        sample_features = vectorizer.transform(["dompet hitam berisi KTM"])
        logger.info(f"Verifikasi TF-IDF: shape={sample_features.shape}")
        logger.info("TF-IDF Vectorizer berhasil diinisialisasi dan disimpan")
        
        return True
    except Exception as e:
        logger.error(f"Error inisialisasi TF-IDF Vectorizer: {str(e)}")
        return False

def init_all_models():
    ensure_directories_exist()
    mobilenet_success = init_mobilenet()  
    tfidf_success = init_tfidf_vectorizer()
    
    if mobilenet_success and tfidf_success:
        logger.info("Semua model berhasil diinisialisasi")
        return True
    else:
        logger.error("Ada error dalam inisialisasi model")
        return False

if __name__ == "__main__":
    init_all_models()