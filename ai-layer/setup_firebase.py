import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import argparse
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def initialize_firebase():
    """Inisialisasi koneksi ke Firebase"""
    try:
        # Cek apakah serviceAccountKey.json ada
        key_path = "firebase_key/serviceAccountKey.json"
        if not os.path.exists(key_path):
            logger.error(f"File {key_path} tidak ditemukan. Harap letakkan service account key di lokasi tersebut.")
            return None
            
        # Inisialisasi Firebase Admin SDK
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase berhasil diinisialisasi")
        return db
    except Exception as e:
        logger.error(f"Error inisialisasi Firebase: {str(e)}")
        return None

def setup_collections(db):
    """Setup koleksi utama di Firestore"""
    try:
        # Cek apakah koleksi sudah ada
        collections = [coll.id for coll in db.collections()]
        logger.info(f"Koleksi yang sudah ada: {collections}")
        
        # Koleksi yang akan dibuat jika belum ada
        required_collections = ['found_items', 'lost_items', 'matches', 'categories']
        
        for collection in required_collections:
            if collection not in collections:
                logger.info(f"Membuat koleksi {collection}...")
                # Tambahkan dokumen dummy untuk membuat koleksi
                db.collection(collection).add({
                    'created_at': firestore.SERVER_TIMESTAMP,
                    'is_dummy': True,
                    'note': 'Dokumen ini dibuat oleh setup script'
                })
                logger.info(f"Koleksi {collection} berhasil dibuat")
        
        return True
    except Exception as e:
        logger.error(f"Error setup koleksi: {str(e)}")
        return False

def setup_categories(db):
    """Setup kategori default di Firestore"""
    try:
        categories = [
            {
                "name": "Dompet/Tas",
                "description": "Dompet, tas, ransel, dan barang sejenis",
                "icon": "wallet",
                "priority": 1
            },
            {
                "name": "Elektronik",
                "description": "Handphone, laptop, charger, dan perangkat elektronik lainnya",
                "icon": "smartphone",
                "priority": 2
            },
            {
                "name": "Kartu Identitas",
                "description": "KTM, KTP, SIM, dan kartu identitas lainnya",
                "icon": "credit-card",
                "priority": 3
            },
            {
                "name": "Kunci",
                "description": "Kunci motor, mobil, rumah, dan sejenisnya",
                "icon": "key",
                "priority": 4
            },
            {
                "name": "Buku/ATK",
                "description": "Buku, catatan, alat tulis, dan perlengkapan kuliah",
                "icon": "book",
                "priority": 5
            },
            {
                "name": "Aksesoris",
                "description": "Jam tangan, kacamata, perhiasan, dan aksesoris lainnya",
                "icon": "watch",
                "priority": 6
            },
            {
                "name": "Pakaian",
                "description": "Jaket, topi, sepatu, dan pakaian lainnya",
                "icon": "shirt",
                "priority": 7
            },
            {
                "name": "Lainnya",
                "description": "Barang lain yang tidak termasuk kategori di atas",
                "icon": "package",
                "priority": 8
            }
        ]
        
        collection_ref = db.collection('categories')
        existing_categories = [doc.to_dict().get('name') for doc in collection_ref.stream() if 'name' in doc.to_dict()]
        
        for category in categories:
            if category['name'] not in existing_categories:
                logger.info(f"Menambahkan kategori: {category['name']}")
                category['item_count'] = 0  # Awalnya 0 item
                category['created_at'] = firestore.SERVER_TIMESTAMP
                collection_ref.add(category)
        
        return True
    except Exception as e:
        logger.error(f"Error setup kategori: {str(e)}")
        return False

def setup_sample_data(db):
    """Setup contoh data untuk pengujian"""
    try:
        # Cek apakah sudah ada data di found_items
        found_items_ref = db.collection('found_items')
        existing_items = [doc for doc in found_items_ref.limit(10).stream()]
        
        if len(existing_items) > 1:  # Lebih dari 1 karena mungkin ada dummy doc
            logger.info(f"Sudah ada {len(existing_items)} item di koleksi found_items, melewati penambahan data sampel")
            return True
            
        # Tambahkan contoh data
        sample_items = [
            {
                "item_name": "Dompet Hitam",
                "description": "Dompet kulit warna hitam berisi kartu mahasiswa dan uang tunai",
                "category": "Dompet/Tas",
                "location": "Perpustakaan Pusat UNY",
                "found_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "available",
                "reporter_name": "Admin",
                "reporter_contact": "admin@unylost.com",
                "created_at": firestore.SERVER_TIMESTAMP,
                "view_count": 0,
                "match_count": 0
            },
            {
                "item_name": "Laptop Asus",
                "description": "Laptop Asus VivoBook warna silver dengan stiker UNY di bagian belakang",
                "category": "Elektronik",
                "location": "Ruang Kuliah FMIPA Lt. 2",
                "found_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "available",
                "reporter_name": "Admin",
                "reporter_contact": "admin@unylost.com",
                "created_at": firestore.SERVER_TIMESTAMP,
                "view_count": 0,
                "match_count": 0
            },
            {
                "item_name": "KTM UNY",
                "description": "Kartu Tanda Mahasiswa UNY atas nama Muhammad Rizky, Jurusan Teknik Informatika",
                "category": "Kartu Identitas",
                "location": "Kantin FMIPA",
                "found_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "available",
                "reporter_name": "Admin",
                "reporter_contact": "admin@unylost.com",
                "created_at": firestore.SERVER_TIMESTAMP,
                "view_count": 0,
                "match_count": 0
            }
        ]
        
        logger.info("Menambahkan data sampel ke koleksi found_items...")
        for item in sample_items:
            # Dummy embedding (akan diupdate nanti dengan gambar sebenarnya)
            item["embedding"] = [0] * 2048  # ResNet50 menghasilkan embedding 2048 dimensi
            item["text_embedding"] = [0] * 100  # Placeholder untuk text embedding
            
            # Tambahkan item
            found_items_ref.add(item)
            
        logger.info(f"Berhasil menambahkan {len(sample_items)} data sampel")
        
        return True
    except Exception as e:
        logger.error(f"Error setup data sampel: {str(e)}")
        return False

def print_setup_instructions():
    """Cetak instruksi setup tambahan"""
    logger.info("\n=== INSTRUKSI TAMBAHAN ===")
    logger.info("1. Untuk menambahkan indeks Firestore, kunjungi Firebase Console > Firestore > Indexes")
    logger.info("2. Tambahkan indeks composite berikut:")
    logger.info("   - Collection: found_items, Fields: category ASC, created_at DESC")
    logger.info("   - Collection: found_items, Fields: status ASC, created_at DESC")
    logger.info("   - Collection: lost_items, Fields: owner_id ASC, created_at DESC")
    logger.info("   - Collection: matches, Fields: lost_item_id ASC, match_score DESC")
    logger.info("3. Untuk menambahkan gambar ke sampel data, gunakan endpoint /image-matcher/add-found-item")
    logger.info("4. Untuk mengaktifkan Google Drive API, kunjungi https://console.cloud.google.com/apis/library/drive.googleapis.com")
    logger.info("5. Update serviceAccountKey.json jika diperlukan")

def main():
    """Fungsi utama untuk setup Firebase"""
    parser = argparse.ArgumentParser(description='Setup Firebase untuk UNYLost')
    parser.add_argument('--with-samples', action='store_true', help='Tambahkan data sampel')
    args = parser.parse_args()
    
    logger.info("Memulai setup Firebase...")
    
    # Inisialisasi Firebase
    db = initialize_firebase()
    if not db:
        return
    
    # Setup koleksi
    if not setup_collections(db):
        return
    
    # Setup kategori
    if not setup_categories(db):
        return
    
    # Setup data sampel jika diminta
    if args.with_samples:
        if not setup_sample_data(db):
            return
    
    logger.info("Setup Firebase berhasil!")
    print_setup_instructions()

if __name__ == "__main__":
    main()