"""
Script untuk menguji kualitas text matching dengan stopwords baru
"""

import os
import sys
import logging
import argparse
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
    # Navigate up to root directory
    root_dir = os.path.dirname(current_dir)
    # Add to path if not already there
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    logger.info(f"Added to path: {root_dir}")

def test_text_matching():
    """Menguji kualitas text matching dengan stopwords baru"""
    add_root_to_path()
    
    # Import fungsi dari module UNYLost
    try:
        from app.services.text_encoder import test_text_similarity, preprocess_text
    except ImportError:
        logger.error("Tidak dapat mengimpor fungsi dari app.services.text_encoder")
        logger.error("Pastikan Anda menjalankan script dari direktori root proyek atau jalankan setup.py terlebih dahulu")
        return False
        
    # Test cases - Pasangan kalimat yang sebaiknya dikenali sebagai mirip
    test_pairs = [
        # Format: (text1, text2, expected_similarity)
        ("dompet hitam berisi kartu mahasiswa", "dompet warna hitam dengan kartu mahasiswa di dalamnya", 0.7),
        ("dompet hitam", "dompet warna hitam", 0.8),
        ("laptop asus warna hitam", "laptop warna hitam merek asus", 0.7),
        ("kunci motor honda vario", "kunci vario jatuh di parkiran", 0.6),
        ("botol minum tupperware biru", "botol minum warna biru merk tupperware", 0.7),
        ("hp samsung galaxy hitam", "samsung galaxy warna hitam dengan case", 0.6),
        ("jam tangan digital", "jam tangan casio digital", 0.6),
        ("payung lipat warna biru", "payung warna biru yang bisa dilipat", 0.6),
        ("kacamata minus frame bulat", "kacamata bulat untuk minus", 0.5),
        
        # Contoh yang sebaiknya memiliki kecocokan rendah
        ("dompet hitam", "kunci motor honda", 0.2),
        ("laptop asus", "handphone samsung", 0.1),
        ("botol minum biru", "headphone bluetooth", 0.1),
        
        # Contoh lokasi UNY
        ("dompet hilang di perpustakaan UNY", "kehilangan dompet di perpus", 0.6),
        ("kunci motor hilang di parkiran FT", "kunci jatuh di area parkir teknik", 0.5),
        ("laptop tertinggal di ruang kuliah FMIPA", "laptop ketinggalan di kelas MIPA", 0.6)
    ]
    
    # Threshold pengujian
    test_threshold = 0.3
    
    logger.info("=" * 50)
    logger.info("PENGUJIAN KUALITAS TEXT MATCHING DENGAN STOPWORDS BARU")
    logger.info("=" * 50)
    logger.info(f"Menggunakan threshold: {test_threshold}")
    logger.info("")
    
    # Hasil pengujian
    results = []
    start_time = time.time()
    
    # Hitung panjang maksimum string untuk formatting
    max_len1 = max(len(pair[0]) for pair in test_pairs)
    max_len2 = max(len(pair[1]) for pair in test_pairs)
    
    for i, (text1, text2, expected) in enumerate(test_pairs):
        # Hitung similarity
        similarity_result = test_text_similarity(text1, text2)
        actual_score = similarity_result["adjusted_similarity"]
        
        # Tentukan hasil tes
        matched = actual_score >= test_threshold
        expected_match = expected >= test_threshold
        test_pass = matched == expected_match
        
        results.append({
            "pair_id": i + 1,
            "text1": text1,
            "text2": text2,
            "expected": expected,
            "actual": actual_score,
            "matched": matched,
            "expected_match": expected_match,
            "common_words": similarity_result.get("common_words", []),
            "test_pass": test_pass
        })
        
        # Tampilkan hasil
        logger.info(f"Test #{i+1}:")
        logger.info(f"Text 1: {text1}")
        logger.info(f"Text 2: {text2}")
        logger.info(f"Preprocessed 1: {similarity_result.get('preprocessed_text1', '')}")
        logger.info(f"Preprocessed 2: {similarity_result.get('preprocessed_text2', '')}")
        logger.info(f"Expected similarity: {expected:.2f}")
        logger.info(f"Actual similarity: {actual_score:.2f}")
        logger.info(f"Common words: {', '.join(similarity_result.get('common_words', []))}")
        logger.info(f"Match? {matched} (Expected: {expected_match})")
        logger.info(f"Test {'PASSED' if test_pass else 'FAILED'}")
        logger.info("-" * 50)
    
    # Hitung statistik
    total_tests = len(test_pairs)
    passed_tests = sum(1 for r in results if r["test_pass"])
    failed_tests = total_tests - passed_tests
    
    elapsed_time = time.time() - start_time
    
    # Tampilkan ringkasan
    logger.info("=" * 50)
    logger.info("RINGKASAN HASIL PENGUJIAN")
    logger.info("=" * 50)
    logger.info(f"Total pengujian: {total_tests}")
    logger.info(f"Lulus: {passed_tests} ({(passed_tests/total_tests*100):.1f}%)")
    logger.info(f"Gagal: {failed_tests} ({(failed_tests/total_tests*100):.1f}%)")
    logger.info(f"Waktu eksekusi: {elapsed_time:.2f} detik")
    logger.info("")
    
    if failed_tests > 0:
        logger.info("Pengujian yang gagal:")
        for r in results:
            if not r["test_pass"]:
                logger.info(f"- Test #{r['pair_id']}: '{r['text1']}' vs '{r['text2']}'")
                logger.info(f"  Expected: {r['expected']:.2f}, Actual: {r['actual']:.2f}")
    
    logger.info("")
    logger.info("=" * 50)
    
    return passed_tests / total_tests

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Uji kualitas text matching dengan stopwords baru')
    parser.add_argument('--threshold', type=float, default=0.3, help='Threshold untuk menguji kecocokan (default: 0.3)')
    args = parser.parse_args()
    
    test_text_matching()