# pylint: disable=all
# type: ignore
# noqa

import os
import csv
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def load_stopwords_from_csv(filepath="stopwordbahasa.csv"):
    stopwords = set()
    
    try:
        if not os.path.exists(filepath):
            logger.warning(f"File stopwords CSV tidak ditemukan: {filepath}")
            return stopwords
            
        with open(filepath, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if row and len(row) > 0:
                    word = row[0].strip().lower()
                    if word:
                        stopwords.add(word)
        
        logger.info(f"Berhasil memuat {len(stopwords)} stopwords dari {filepath}")
        
        save_path = "app/models/indonesian_stopwords.txt"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(stopwords)))
            
        logger.info(f"Stopwords disimpan ke {save_path} untuk penggunaan di masa depan")
        
        return stopwords
        
    except Exception as e:
        logger.error(f"Error saat memuat stopwords dari CSV: {str(e)}")
        return stopwords

def extend_with_domain_specific_stopwords(stopwords):
    domain_stopwords = {
        # Kata-kata dasar
        "barang", "hilang", "temuan", "ditemukan", "kehilangan",
        "menemukan", "mencari", "warna", "milik", "punya",
        "berwarna", "tertinggal", "jatuh", "ketinggalan", "lupa",
        
        # Lokasi UNY
        "uny", "universitas", "negeri", "yogyakarta", "kampus",
        "fakultas", "gedung", "ruang", "kelas", "laboratorium", 
        "perpustakaan", "kantin", "rektorat", "fmipa", "ft", "fip",
        "fbs", "fe", "fik", "pascasarjana",
        
        # Kata-kata umum untuk context finder
        "tolong", "mohon", "bantuan", "informasi", "kabar", 
        "hubungi", "kontak", "nomor", "telepon", "wa", "whatsapp", 
        "line", "instagram", "urgent", "darurat", "terima", "kasih", 
        
        # Kata sifat umum
        "besar", "kecil", "panjang", "pendek", "tinggi", "rendah",
        "tebal", "tipis", "baru", "lama", "bagus", "jelek", "rusak",
        
        # Warna
        "merah", "biru", "hijau", "kuning", "putih", "hitam",
        "coklat", "orange", "ungu", "pink", "abu", "silver", "emas",
        
        # Kata-kata penghubung dan umum lainnya
        "dan", "atau", "juga", "serta", "namun", "tetapi",
        "karena", "sebab", "akibat", "maka", "jadi", "oleh",
        "kepada", "dari", "untuk", "pada", "tentang", "dengan",
        "tanpa", "seperti", "bagi", "mengenai"
    }
    
    combined = stopwords.union(domain_stopwords)
    logger.info(f"Menambahkan {len(domain_stopwords)} stopwords domain-specific")
    logger.info(f"Total stopwords setelah digabungkan: {len(combined)}")
    
    return combined

def setup_stopwords_for_text_matcher():
    try:
        stopwords = load_stopwords_from_csv()
        extended_stopwords = extend_with_domain_specific_stopwords(stopwords)
        os.makedirs("app/models", exist_ok=True)
        save_path = "app/models/indonesian_stopwords.txt"
        
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(extended_stopwords)))
        
        logger.info(f"Setup stopwords selesai. Total {len(extended_stopwords)} stopwords siap digunakan")
        logger.info(f"Stopwords disimpan ke {save_path}")
        from app.services.text_encoder import refresh_all_text_embeddings
        refresh_result = refresh_all_text_embeddings()
        
        return {
            "success": True,
            "stopwords_count": len(extended_stopwords),
            "original_csv_count": len(stopwords),
            "refresh_embedding_result": refresh_result
        }
    
    except Exception as e:
        logger.error(f"Error dalam setup stopwords: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    setup_stopwords_for_text_matcher()