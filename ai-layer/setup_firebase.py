import firebase_admin
from firebase_admin import credentials, firestore
import os
import argparse
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def initialize_firebase():
    try:
        key_path = "firebase_key/serviceAccountKey.json"
        if not os.path.exists(key_path):
            logger.error(f"File {key_path} tidak ditemukan. Harap letakkan service account key di lokasi tersebut.")
            return None
            
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase berhasil diinisialisasi")
        return db
    except Exception as e:
        logger.error(f"Error inisialisasi Firebase: {str(e)}")
        return None

def clear_all_data(db):
    try:
        collections = [coll.id for coll in db.collections()]
        logger.info(f"Ditemukan koleksi: {collections}")
        
        deleted_docs = 0
        
        for collection_name in collections:
            docs = list(db.collection(collection_name).stream())
            logger.info(f"Menghapus {len(docs)} dokumen dari koleksi {collection_name}...")
            
            for doc in docs:
                doc.reference.delete()
                deleted_docs += 1
        
        logger.info(f"Berhasil menghapus total {deleted_docs} dokumen dari {len(collections)} koleksi")
        return True
    except Exception as e:
        logger.error(f"Error menghapus data: {str(e)}")
        return False

def setup_collections(db):
    try:
        collections = [coll.id for coll in db.collections()]
        logger.info(f"Koleksi yang sudah ada: {collections}")
        
        required_collections = ['found_items', 'lost_items', 'matches', 'categories', 'match_feedback', 'system_settings']
        
        for collection in required_collections:
            if collection not in collections:
                logger.info(f"Membuat koleksi {collection}...")
                db.collection(collection)
                logger.info(f"Koleksi {collection} berhasil dibuat")
        
        return True
    except Exception as e:
        logger.error(f"Error setup koleksi: {str(e)}")
        return False

def setup_categories(db):
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
        
        for category in categories:
            logger.info(f"Menambahkan kategori: {category['name']}")
            category['item_count'] = 0  # Awalnya 0 item
            category['created_at'] = datetime.now()
            collection_ref.add(category)
        
        logger.info(f"Berhasil menambahkan {len(categories)} kategori")
        return True
    except Exception as e:
        logger.error(f"Error setup kategori: {str(e)}")
        return False

def setup_initial_settings(db):
    try:
        thresholds = {
            "image_threshold": 0.3,
            "text_threshold": 0.3,
            "hybrid_weight_image": 0.4,
            "hybrid_weight_text": 0.6,
            "updated_at": datetime.now(),
        }
        
        db.collection("system_settings").document("matching_thresholds").set(thresholds)
        
        logger.info("Pengaturan awal sistem berhasil dibuat")
        return True
    except Exception as e:
        logger.error(f"Error setup pengaturan awal: {str(e)}")
        return False

def print_setup_instructions():
    """Cetak instruksi setup tambahan"""
    logger.info("\n=== INSTRUKSI TAMBAHAN ===")
    logger.info("1. Untuk menambahkan indeks Firestore, kunjungi Firebase Console > Firestore > Indexes")
    logger.info("2. Tambahkan indeks composite berikut:")
    logger.info("   - Collection: found_items, Fields: category ASC, created_at DESC")
    logger.info("   - Collection: found_items, Fields: status ASC, created_at DESC")
    logger.info("   - Collection: match_feedback, Fields: timestamp DESC")
    logger.info("3. Untuk mengaktifkan Google Drive API, kunjungi https://console.cloud.google.com/apis/library/drive.googleapis.com")
    logger.info("4. Update serviceAccountKey.json jika diperlukan")
    logger.info("5. Pastikan inisialisasi model dengan menjalankan init_models.py")

def main():
    parser = argparse.ArgumentParser(description='Setup Firebase untuk UNYLost')
    parser.add_argument('--clean', action='store_true', help='Hapus semua data yang ada')
    parser.add_argument('--skip-categories', action='store_true', help='Lewati pembuatan kategori')
    args = parser.parse_args()
    
    logger.info("Memulai setup Firebase...")
    
    # Inisialisasi Firebase
    db = initialize_firebase()
    if not db:
        return
    
    # Hapus semua data jika diminta
    if args.clean:
        logger.info("Menghapus semua data dari Firestore...")
        if not clear_all_data(db):
            return
    
    # Setup koleksi
    if not setup_collections(db):
        return
    
    # Setup kategori jika tidak dilewati
    if not args.skip_categories:
        if not setup_categories(db):
            return
    
    # Setup pengaturan awal
    if not setup_initial_settings(db):
        return
    
    logger.info("Setup Firebase berhasil!")
    print_setup_instructions()

if __name__ == "__main__":
    main()