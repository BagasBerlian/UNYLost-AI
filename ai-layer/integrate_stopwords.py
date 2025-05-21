# pylint: disable=all
# type: ignore
# noqa

import os
import sys
import logging
import argparse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def add_paths():
    """Menambahkan path ke sys.path untuk import modul"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)
    sys.path.insert(0, root_dir)
    logger.info(f"Menambahkan path: {root_dir}")

def main():
    parser = argparse.ArgumentParser(description="Integrasi stopwords dan refresh embeddings")
    parser.add_argument(
        "--csv", 
        type=str, 
        default="stopwordbahasa.csv",
        help="Path ke file CSV yang berisi stopwords (default: stopwordbahasa.csv)"
    )
    parser.add_argument(
        "--refresh-only", 
        action="store_true",
        help="Hanya refresh embeddings tanpa memperbarui stopwords"
    )
    parser.add_argument(
        "--threshold", 
        type=float, 
        default=0.2,
        help="Threshold untuk text matching (default: 0.2)"
    )
    
    args = parser.parse_args()
    
    add_paths()
    
    try:
        if not args.refresh_only:
            from app.services.stopwords_loader import setup_stopwords_for_text_matcher
            
            logger.info(f"Memulai setup stopwords dari file: {args.csv}")
            result = setup_stopwords_for_text_matcher()
            
            if not result["success"]:
                logger.error(f"Gagal setup stopwords: {result.get('error', 'Unknown error')}")
                return False
                
            logger.info(f"Setup stopwords berhasil. Total {result['stopwords_count']} stopwords")
        else:
            logger.info("Melewati setup stopwords (refresh-only mode)")
        
        from app.services.text_encoder import refresh_all_text_embeddings, load_vectorizer
        
        load_vectorizer(force_retrain=True)
        
        logger.info("Memperbarui text embeddings...")
        refresh_result = refresh_all_text_embeddings()
        
        logger.info(f"Berhasil memperbarui {refresh_result['updated_count']} text embeddings")
        
        from app.services.text_encoder import test_text_similarity
        
        test_samples = [
            ("dompet hitam berisi KTM", "dompet warna hitam dengan kartu mahasiswa"),
            ("laptop asus warna hitam", "laptop warna hitam merek asus"),
            ("kunci motor honda vario", "kunci motor vario honda jatuh"),
            ("botol minum tupperware biru", "botol minum warna biru")
        ]
        
        logger.info("\nHasil uji text matching dengan stopwords baru:")
        for sample1, sample2 in test_samples:
            sim_result = test_text_similarity(sample1, sample2)
            logger.info(f"  - '{sample1}' VS '{sample2}':")
            logger.info(f"    * Skor: {sim_result['adjusted_similarity']:.4f}")
            logger.info(f"    * Kata yang cocok: {', '.join(sim_result['common_words'])}")
            logger.info(f"    * Matched? {'YA' if sim_result['adjusted_similarity'] >= args.threshold else 'TIDAK'}")
            logger.info("")
        
        logger.info("Proses integrasi stopwords dan refresh embeddings selesai!")
        return True
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()