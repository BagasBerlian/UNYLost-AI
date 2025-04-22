from firebase_admin import credentials, firestore, initialize_app
import os
import json
import argparse
from datetime import datetime, timedelta
import uuid

# Setup argparse untuk opsi command line
parser = argparse.ArgumentParser(description='Setup Firebase untuk UNYLost')
parser.add_argument('--reset', action='store_true', help='Reset database dan hapus semua data')
parser.add_argument('--sample', action='store_true', help='Tambahkan data sampel')
args = parser.parse_args()

print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Memulai setup Firebase...")

# 1. Cek dan validasi file konfigurasi Firebase
if not os.path.exists("firebase_key/serviceAccountKey.json"):
    print("❌ File serviceAccountKey.json tidak ditemukan di folder firebase_key/")
    print("Silakan unduh file konfigurasi dari Firebase Console dan simpan di lokasi tersebut")
    exit(1)

# 2. Inisialisasi Firebase
try:
    cred = credentials.Certificate("firebase_key/serviceAccountKey.json")
    app = initialize_app(cred)
    db = firestore.client()
    print("✅ Koneksi ke Firebase berhasil")
except Exception as e:
    print(f"❌ Gagal menginisialisasi Firebase: {str(e)}")
    exit(1)

# 3. Fungsi untuk reset database jika diminta
def reset_database():
    if not args.reset:
        return
    
    print("⚠️ Menghapus semua data di database...")
    
    collections = ["found_items", "lost_items", "match_feedback", "users", "match_history"]
    
    for collection in collections:
        docs = db.collection(collection).limit(500).stream()
        deleted = 0
        
        for doc in docs:
            doc.reference.delete()
            deleted += 1
        
        print(f"   Menghapus {deleted} dokumen dari koleksi {collection}")
    
    print("✅ Reset database selesai")

# 4. Fungsi untuk membuat koleksi dan struktur dasar
def setup_collections():
    collections = [
        {
            "name": "found_items",
            "fields": [
                "item_name", "category", "description", "location_found", 
                "date_found", "reporter_id", "reporter_contact", "status",
                "image_url", "embedding", "text_embedding"
            ]
        },
        {
            "name": "lost_items",
            "fields": [
                "item_name", "category", "description", "last_seen_location", 
                "date_lost", "owner_id", "owner_contact", "status",
                "reward", "image_url", "embedding", "text_embedding"
            ]
        },
        {
            "name": "match_feedback",
            "fields": [
                "match_id", "is_correct", "user_id", "timestamp"
            ]
        },
        {
            "name": "match_history",
            "fields": [
                "lost_item_id", "found_item_id", "match_date", "match_score",
                "match_type", "status"
            ]
        },
        {
            "name": "users",
            "fields": [
                "user_id", "email", "name", "phone", "avatar_url", "last_login"
            ]
        }
    ]
    
    # Cek dan buat koleksi jika belum ada
    for collection in collections:
        col_ref = db.collection(collection["name"])
        if len(list(col_ref.limit(1).stream())) == 0:
            print(f"Membuat struktur untuk koleksi {collection['name']}...")
            
            # Tambahkan dokumen khusus untuk metadata koleksi
            metadata_doc = {
                "collection_info": True,
                "fields": collection["fields"],
                "created_at": datetime.now().isoformat(),
                "version": "1.0.0"
            }
            
            col_ref.document("__metadata__").set(metadata_doc)
    
    print("✅ Setup struktur koleksi selesai")

# 5. Fungsi untuk membuat data sampel
def create_sample_data():
    if not args.sample:
        return
    
    print("Membuat data sampel...")
    
    # Sampel kategori
    categories = ["Kartu Identitas", "Dompet", "Elektronik", "Kunci", "Buku", "Pakaian", "Aksesoris", "Lainnya"]
    
    # Sampel lokasi di UNY
    locations = [
        "Perpustakaan Pusat UNY", "Kantin FMIPA", "Gedung Rektorat",
        "Fakultas Teknik", "Fakultas Ekonomi", "Lapangan Olahraga",
        "Halte Bus UNY", "Gazebo Taman UNY", "Laboratorium Komputer",
        "Masjid Kampus UNY"
    ]
    
    # Sampel data barang hilang
    lost_items_data = [
        {
            "item_name": "Kartu Mahasiswa UNY",
            "category": "Kartu Identitas",
            "description": "Kartu mahasiswa berwarna biru dengan nama Budi Santoso dan NIM 19201241025",
            "last_seen_location": "Perpustakaan Pusat UNY",
            "date_lost": (datetime.now() - timedelta(days=3)).isoformat(),
            "owner_id": "user_" + str(uuid.uuid4())[:8],
            "owner_contact": "081234567890",
            "status": "pending",
            "reward": "Rp50.000 bagi yang menemukan",
            "image_url": "",
            "embedding": [],
            "text_embedding": []
        },
        {
            "item_name": "Laptop ASUS ROG",
            "category": "Elektronik",
            "description": "Laptop gaming warna hitam dengan stiker logo UNY di bagian belakang layar",
            "last_seen_location": "Laboratorium Komputer FMIPA",
            "date_lost": (datetime.now() - timedelta(days=1)).isoformat(),
            "owner_id": "user_" + str(uuid.uuid4())[:8],
            "owner_contact": "085712345678",
            "status": "pending",
            "reward": "Rp500.000 bagi yang menemukan",
            "image_url": "",
            "embedding": [],
            "text_embedding": []
        },
        {
            "item_name": "Dompet Coklat",
            "category": "Dompet",
            "description": "Dompet kulit berwarna coklat berisi KTP, ATM BRI, dan uang tunai Rp300.000",
            "last_seen_location": "Kantin Fakultas Ekonomi",
            "date_lost": (datetime.now() - timedelta(days=2)).isoformat(),
            "owner_id": "user_" + str(uuid.uuid4())[:8],
            "owner_contact": "087812345678",
            "status": "pending",
            "reward": "Rp100.000 bagi yang menemukan",
            "image_url": "",
            "embedding": [],
            "text_embedding": []
        }
    ]
    
    # Sampel data barang temuan
    found_items_data = [
        {
            "item_name": "Kartu Mahasiswa",
            "category": "Kartu Identitas",
            "description": "Kartu mahasiswa UNY atas nama Indah Permata, jurusan Pendidikan Matematika",
            "location_found": "Gedung FMIPA Lantai 2",
            "date_found": (datetime.now() - timedelta(days=1)).isoformat(),
            "reporter_id": "user_" + str(uuid.uuid4())[:8],
            "reporter_contact": "089712345678",
            "status": "pending",
            "image_url": "",
            "embedding": [],
            "text_embedding": []
        },
        {
            "item_name": "Kunci Motor Honda",
            "category": "Kunci",
            "description": "Kunci motor Honda dengan gantungan kunci logo UNY",
            "location_found": "Parkiran Fakultas Teknik",
            "date_found": (datetime.now() - timedelta(hours=5)).isoformat(),
            "reporter_id": "user_" + str(uuid.uuid4())[:8],
            "reporter_contact": "081298765432",
            "status": "pending",
            "image_url": "",
            "embedding": [],
            "text_embedding": []
        },
        {
            "item_name": "Payung Lipat Hitam",
            "category": "Aksesoris",
            "description": "Payung lipat warna hitam dengan logo bank BNI",
            "location_found": "Halte Bus UNY",
            "date_found": (datetime.now() - timedelta(days=2)).isoformat(),
            "reporter_id": "user_" + str(uuid.uuid4())[:8],
            "reporter_contact": "085698765432",
            "status": "pending",
            "image_url": "",
            "embedding": [],
            "text_embedding": []
        }
    ]
    
    # Tambahkan data sampel ke Firebase
    for item in lost_items_data:
        db.collection("lost_items").add(item)
    
    for item in found_items_data:
        db.collection("found_items").add(item)
    
    # Tambahkan contoh feedback matching
    db.collection("match_feedback").add({
        "match_id": "sample_match_id",
        "is_correct": True,
        "user_id": "sample_user_id",
        "timestamp": datetime.now().isoformat()
    })
    
    # Tambahkan contoh match history
    db.collection("match_history").add({
        "lost_item_id": "sample_lost_id",
        "found_item_id": "sample_found_id",
        "match_date": datetime.now().isoformat(),
        "match_score": 0.85,
        "match_type": "image",
        "status": "confirmed"
    })
    
    print(f"✅ Berhasil menambahkan {len(lost_items_data)} data barang hilang")
    print(f"✅ Berhasil menambahkan {len(found_items_data)} data barang temuan")
    print(f"✅ Berhasil menambahkan data sampel match feedback dan history")

# 6. Setup indeks Firebase (penting untuk query)
def setup_indexes():
    print("Menyiapkan informasi tentang indeks yang perlu dibuat di Firebase...")
    
    # Indeks yang direkomendasikan untuk performa query
    recommended_indexes = [
        {
            "collection": "found_items",
            "fields": ["status", "date_found"]
        },
        {
            "collection": "lost_items",
            "fields": ["status", "date_lost"]
        },
        {
            "collection": "found_items",
            "fields": ["category", "date_found"]
        },
        {
            "collection": "lost_items",
            "fields": ["category", "date_lost"]
        }
    ]
    
    print("\nSaran pembuatan indeks di Firebase Console:")
    print("------------------------------------------")
    for idx in recommended_indexes:
        print(f"Koleksi: {idx['collection']}")
        print(f"Fields: {', '.join(idx['fields'])}")
        print("------------------------------------------")
    
    print("\nCatatan: Indeks harus dibuat secara manual di Firebase Console")
    print("Buka: https://console.firebase.google.com/ -> Firestore Database -> Indexes")

# Eksekusi fungsi utama
try:
    reset_database() if args.reset else None
    setup_collections()
    create_sample_data() if args.sample else None
    setup_indexes()
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ✅ Setup Firebase berhasil!")
    print("Anda dapat menjalankan aplikasi dengan perintah: python run.py")
except Exception as e:
    print(f"❌ Terjadi kesalahan: {str(e)}")