import torch
import torchvision.models as models
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from datetime import datetime

print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Memulai inisialisasi model...")

# 1. Persiapan direktori
os.makedirs("app/models", exist_ok=True)
os.makedirs("app/embeddings", exist_ok=True)

# 2. Mengunduh resource NLTK untuk pemrosesan bahasa alami
print("Mengunduh resource NLTK...")
nltk.download('stopwords')
nltk.download('punkt')

# Stopwords custom
stopwords_id = [
    "yang", "dan", "di", "dengan", "ini", "itu", "atau", "pada", "juga",
    "dari", "akan", "ke", "karena", "oleh", "saat", "tersebut", "sangat",
    "untuk", "dalam", "tidak", "ada", "telah", "seperti", "sebagai",
    "bahwa", "dapat", "para", "harus", "bisa", "demikian", "sebuah",
    "adalah", "merupakan", "hingga"
]

# 3. Inisialisasi model gambar (ResNet50)
print("Menginisialisasi model ResNet...")
try:
    # Menggunakan pretrained=True untuk mendapatkan model yang sudah dilatih pada ImageNet
    model = models.resnet50(pretrained=True)
    # Hilangkan layer terakhir untuk mendapatkan feature extractor
    resnet_feature_extractor = torch.nn.Sequential(*list(model.children())[:-1])
     # Set model ke mode evaluasi
    resnet_feature_extractor.eval() 

    # Simpan model ke direktori model
    torch.save(resnet_feature_extractor.state_dict(), "app/models/resnet50_feature_extractor.pth")
    print("✅ Model ResNet50 berhasil disimpan")
except Exception as e:
    print(f"❌ Gagal menginisialisasi ResNet: {str(e)}")
    raise

# 4. Inisialisasi TF-IDF Vectorizer untuk pemrosesan teks
print("Menginisialisasi TF-IDF Vectorizer...")
try:
    # Membuat vectorizer dengan parameter yang optimal untuk pencocokan teks
    vectorizer = TfidfVectorizer(
        lowercase=True,  # Konversi semua teks menjadi huruf kecil
        stop_words=stopwords_id,  # Gunakan stopwords bahasa Indonesia
        ngram_range=(1, 2),  # Gunakan unigram dan bigram untuk hasil lebih baik
        max_df=0.85,  # Abaikan kata yang muncul di >85% dokumen (terlalu umum)
        min_df=2,     # Abaikan kata yang muncul kurang dari 2 dokumen
        max_features=5000  # Batasi jumlah fitur untuk efisiensi
    )

    # Buat contoh data untuk fitting vectorizer
    # Data ini penting untuk "mengajari" vectorizer tentang domain spesifik (barang hilang)
    sample_texts = [
        "kartu tanda mahasiswa hilang di perpustakaan",
        "menemukan dompet berisi uang dan kartu di kantin",
        "laptop tertinggal di ruang kelas fakultas teknik",
        "kunci motor hilang di parkiran fakultas ekonomi",
        "menemukan payung di halte bus",
        "kehilangan buku catatan kuliah di gazebo kampus",
        "menemukan flashdisk di laboratorium komputer",
        "jaket tertinggal di ruang seminar",
        "helm motor hilang di parkiran basement",
        "kehilangan handphone samsung di toilet perpustakaan"
    ]

    # Fit vectorizer dengan contoh data
    vectorizer.fit(sample_texts)

    # Simpan vectorizer ke file pickle
    with open("app/models/tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    print("✅ TF-IDF Vectorizer berhasil disimpan")
    
    # Simpan juga contoh embedding sebagai referensi
    sample_embeddings = []
    for i, text in enumerate(sample_texts):
        vector = vectorizer.transform([text]).toarray()[0]
        sample_embeddings.append({
            "id": f"sample_{i+1}",
            "text": text,
            "embedding": vector
        })
    
    with open("app/embeddings/sample_text_embeddings.pkl", "wb") as f:
        pickle.dump(sample_embeddings, f)
    print("✅ Contoh embedding teks berhasil disimpan")
    
except Exception as e:
    print(f"❌ Gagal menginisialisasi TF-IDF Vectorizer: {str(e)}")
    raise

# 5. Validasi instalasi dengan mencoba menggunakan model yang telah disimpan
print("Memvalidasi model yang diinisialisasi...")
try:
    # Coba muat model ResNet
    loaded_model = torch.nn.Sequential(*list(models.resnet50().children())[:-1])
    loaded_model.load_state_dict(torch.load("app/models/resnet50_feature_extractor.pth"))
    
    # Coba muat vectorizer
    with open("app/models/tfidf_vectorizer.pkl", "rb") as f:
        loaded_vectorizer = pickle.load(f)
    
    test_text = "pengujian vectorizer tfidf"
    vector = loaded_vectorizer.transform([test_text])
    
    print("✅ Validasi model berhasil!")
except Exception as e:
    print(f"❌ Validasi model gagal: {str(e)}")
    raise

print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ Seluruh proses inisialisasi model selesai!")
print("Anda dapat menjalankan aplikasi dengan perintah: python run.py")