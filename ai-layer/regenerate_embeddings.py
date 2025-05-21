"""
Script untuk meregenerasi semua text embedding di Firebase
setelah perubahan vectorizer atau stopwords
"""

import os
import sys
import logging
import time
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def add_root_to_path():
    """Menambahkan path root ke sys.path"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate up to root directory if script berada di subfolder
    root_dir = os.path.dirname(current_dir) if os.path.basename(current_dir) != "ai-layer" else current_dir
    # Add to path if not already there
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    logger.info(f"Ditambahkan ke path: {root_dir}")

def regenerate_all_embeddings():
    """Meregenerasi semua text embedding di Firebase"""
    try:
        # 1. Import modul yang diperlukan
        add_root_to_path()
        
        # Impor fungsi yang diperlukan
        from app.services.firebase import db
        from app.services.text_encoder import preprocess_text, extract_text_features
        
        # 2. Force train ulang vectorizer
        from app.services.text_encoder import load_vectorizer, train_tfidf_with_data
        
        logger.info("Melatih ulang vectorizer...")
        num_docs = train_tfidf_with_data()
        logger.info(f"Vectorizer dilatih ulang dengan {num_docs} dokumen")
        
        # 3. Regenerasi semua embedding di Firebase
        # 3.1 Regenerasi embedding untuk found_items
        logger.info("Memperbarui embeddings untuk found_items...")
        start_time = time.time()
        
        found_docs = db.collection("found_items").stream()
        found_count = 0
        found_updated = 0
        found_failed = 0
        
        for doc in found_docs:
            found_count += 1
            try:
                data = doc.to_dict()
                description = data.get("description", "")
                
                if description:
                    # Ekstrak fitur baru
                    new_embedding = extract_text_features(description)
                    
                    # Update di Firebase
                    db.collection("found_items").document(doc.id).update({
                        "text_embedding": new_embedding.tolist()
                    })
                    
                    found_updated += 1
                    if found_updated % 10 == 0:
                        logger.info(f"Memperbarui {found_updated}/{found_count} dokumen found_items...")
            except Exception as e:
                found_failed += 1
                logger.error(f"Error saat memperbarui dokumen {doc.id}: {str(e)}")
        
        # 3.2 Regenerasi embedding untuk lost_items
        logger.info("Memperbarui embeddings untuk lost_items...")
        
        lost_docs = db.collection("lost_items").stream()
        lost_count = 0
        lost_updated = 0
        lost_failed = 0
        
        for doc in lost_docs:
            lost_count += 1
            try:
                data = doc.to_dict()
                description = data.get("description", "")
                
                if description:
                    # Ekstrak fitur baru
                    new_embedding = extract_text_features(description)
                    
                    # Update di Firebase
                    db.collection("lost_items").document(doc.id).update({
                        "text_embedding": new_embedding.tolist()
                    })
                    
                    lost_updated += 1
                    if lost_updated % 10 == 0:
                        logger.info(f"Memperbarui {lost_updated}/{lost_count} dokumen lost_items...")
            except Exception as e:
                lost_failed += 1
                logger.error(f"Error saat memperbarui dokumen {doc.id}: {str(e)}")
        
        elapsed_time = time.time() - start_time
        
        # 4. Cetak ringkasan
        logger.info("\n" + "=" * 50)
        logger.info("RINGKASAN REGENERASI EMBEDDING")
        logger.info("=" * 50)
        logger.info(f"Total dokumen found_items: {found_count}")
        logger.info(f"  - Berhasil diperbarui: {found_updated}")
        logger.info(f"  - Gagal diperbarui: {found_failed}")
        logger.info(f"Total dokumen lost_items: {lost_count}")
        logger.info(f"  - Berhasil diperbarui: {lost_updated}")
        logger.info(f"  - Gagal diperbarui: {lost_failed}")
        logger.info(f"Total waktu: {elapsed_time:.2f} detik")
        logger.info("=" * 50)
        
        return {
            "success": True,
            "found_items": {
                "total": found_count,
                "updated": found_updated,
                "failed": found_failed
            },
            "lost_items": {
                "total": lost_count,
                "updated": lost_updated,
                "failed": lost_failed
            },
            "elapsed_time": elapsed_time
        }
        
    except Exception as e:
        logger.error(f"Error dalam regenerasi embedding: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    logger.info("Memulai regenerasi semua text embedding...")
    result = regenerate_all_embeddings()
    
    if result["success"]:
        logger.info("Regenerasi embedding selesai dengan sukses!")
    else:
        logger.error(f"Regenerasi embedding gagal: {result.get('error', 'Unknown error')}")