# pylint: disable=all
# type: ignore
# noqa

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pickle
import os
import re
import logging
from app.services.firebase import db
import time

logger = logging.getLogger(__name__)

def load_stopwords(filepath="app/models/indonesian_stopwords.txt"):
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                stopwords = {line.strip() for line in f if line.strip()}
            logger.info(f"Berhasil memuat {len(stopwords)} stopwords dari {filepath}")
            return stopwords
        else:
            logger.warning(f"File stopwords tidak ditemukan: {filepath}")
            return STOPWORDS_ID_DEFAULT
    except Exception as e:
        logger.error(f"Error saat memuat stopwords: {str(e)}")
        return STOPWORDS_ID_DEFAULT


STOPWORDS_ID_DEFAULT = set([
    'yang', 'dan', 'di', 'ke', 'pada', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
    'atau', 'juga', 'dari', 'akan', 'tidak', 'telah', 'dalam', 'secara', 'sehingga',
    'oleh', 'saya', 'kamu', 'dia', 'mereka', 'kami', 'kita', 'ada', 'bisa', 'dapat',
    'sudah', 'belum', 'jika', 'kalau', 'namun', 'tetapi', 'maka', 'sebagai', 'karena',
    'ketika', 'apabila', 'seperti', 'sebuah', 'suatu', 'bahwa', 'sangat', 'lebih', 'kurang',
    'atas', 'bawah', 'kiri', 'kanan', 'depan', 'belakang', 'samping', 'luar', 'antara',
    'sekitar', 'melalui', 'terhadap', 'tentang', 'tanpa', 'setelah', 'sebelum', 'selama',
    'sementara', 'sejak', 'hingga', 'sampai', 'saat', 'waktu', 'ketika'
])  

STOPWORDS_ID = load_stopwords()

def custom_tokenizer(text):
    tokens = []
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    words = text.split()
    for word in words:
        if len(word) > 2 and word not in STOPWORDS_ID:
            tokens.append(word)
    
    return tokens

vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 3), 
    max_features=20000, 
    min_df=1,  
    max_df=0.90, 
    stop_words=list(STOPWORDS_ID),  
    sublinear_tf=True,
    tokenizer=custom_tokenizer, 
)

def preprocess_text(text):
    if not text:
        return ""
        
    text = text.lower()
    text = re.sub(r'http\S+', ' URL ', text)
    text = re.sub(r'\b\d+\b', ' NUM ', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = custom_tokenizer(text)
    processed_text = ' '.join(tokens)
    return processed_text

def load_vectorizer(force_retrain=False):
    global vectorizer
    path = "app/models/tfidf_vectorizer.pkl"
    try:
        if os.path.exists(path) and not force_retrain:
            with open(path, 'rb') as f:
                vectorizer = pickle.load(f)
            logger.info("Vectorizer berhasil dimuat dari file")
            return True
        else:
            if force_retrain:
                logger.info("Force retrain vectorizer...")
            else:
                logger.info("Vectorizer tidak ditemukan, melatih dengan data contoh...")
            
            sample_docs = [
                "dompet hitam berisi kartu mahasiswa",
                "laptop asus warna silver dengan stiker",
                "kunci motor honda dengan gantungan",
                "buku catatan berwarna merah", 
                "kartu tanda mahasiswa universitas negeri yogyakarta",
                "hp samsung warna hitam layar retak",
                "kacamata minus frame hitam",
                "jam tangan casio berwarna silver",
                "botol minum tupperware warna biru",
                "tas ransel hitam adidas",
                "jaket warna navy hoodie",
                "headphone bluetooth sony warna hitam",
                "charger laptop lenovo ujung warna kuning",
                "flash disk sandisk warna biru",
                "payung lipat warna hitam"
            ]
            
            try:
                docs = db.collection("found_items").limit(50).stream()
                db_descriptions = []
                
                for doc in docs:
                    data = doc.to_dict()
                    description = data.get("description", "")
                    if description:
                        db_descriptions.append(description)
                
                if db_descriptions:
                    logger.info(f"Menambahkan {len(db_descriptions)} deskripsi dari database")
                    sample_docs.extend(db_descriptions)
            except Exception as e:
                logger.warning(f"Gagal mengambil deskripsi dari database: {str(e)}")
            
            processed_docs = [preprocess_text(doc) for doc in sample_docs]
            vectorizer.fit(processed_docs)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'wb') as f:
                pickle.dump(vectorizer, f)
                
            logger.info(f"Vectorizer berhasil dilatih dengan {len(sample_docs)} dokumen contoh")
            return True
            
    except Exception as e:
        logger.error(f"Error saat memuat/melatih vectorizer: {str(e)}")
        return False

def extract_text_features(text):
    try:
        preprocessed_text = preprocess_text(text)
        
        if not hasattr(vectorizer, 'vocabulary_') or vectorizer.vocabulary_ is None:
            load_vectorizer()
        
        features = vectorizer.transform([preprocessed_text])
        return features.toarray()[0]
        
    except Exception as e:
        logger.error(f"Error saat ekstrak fitur teks: {str(e)}")
        if hasattr(vectorizer, 'get_feature_names_out'):
            return np.zeros(len(vectorizer.get_feature_names_out()))
        return np.zeros(1000)

def find_similar_items_by_text(query_text, threshold=0.2, collection="found_items", max_results=20):
    try:
        start_time = time.time()
        query_features = extract_text_features(query_text)
        found_data = load_text_embeddings_from_firebase(collection=collection)
        preprocessed_query = preprocess_text(query_text)
        query_words = set(preprocessed_query.split())
        similarities = []
        
        for item in found_data:
            if "text_embedding" not in item or len(item["text_embedding"]) == 0:
                continue
                
            if item.get("status", "available") != "available" and collection == "found_items":
                continue
            
            sim = cosine_similarity([query_features], [item["text_embedding"]])[0][0]
            desc_words = set(preprocess_text(item.get("description", "")).split())
            common_words = query_words.intersection(desc_words)
            word_overlap = len(common_words) / max(len(query_words), 1) if query_words else 0
            context_score = 0.0
            
            if "item_name" in item and item["item_name"].lower() in query_text.lower():
                context_score += 0.15
                
            adjusted_sim = (sim * 0.6) + (word_overlap * 0.3) + context_score
            adjusted_sim = min(adjusted_sim, 1.0)  
            
            if adjusted_sim >= threshold:
                similarities.append({
                    **item,
                    "score": float(adjusted_sim),
                    "match_type": "text",
                    "raw_score": float(sim),
                    "word_overlap": float(word_overlap),
                    "context_score": float(context_score),
                    "common_words": list(common_words)[:10]
                })
        
        similarities = sorted(similarities, key=lambda x: x["score"], reverse=True)
        similarities = similarities[:max_results]
        elapsed_time = time.time() - start_time
        logger.info(f"Text matching selesai dalam {elapsed_time:.2f} detik, menemukan {len(similarities)} hasil")
        return similarities
        
    except Exception as e:
        logger.error(f"Error dalam text matching: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def load_text_embeddings_from_firebase(collection="found_items"):
    try:
        start_time = time.time()
        docs = db.collection(collection).stream()
        embeddings = []
        items_without_embedding = 0

        for doc in docs:
            data = doc.to_dict()
            description = data.get("description", "")
            
            if description and "text_embedding" not in data:
                items_without_embedding += 1
                text_embedding = extract_text_features(description)
                try:
                    db.collection(collection).document(doc.id).update({
                        "text_embedding": text_embedding.tolist()
                    })
                    data["text_embedding"] = text_embedding.tolist()
                except Exception as update_error:
                    logger.error(f"Error update embedding: {str(update_error)}")
            
            if description:
                text_embedding = data.get("text_embedding", [])
                if isinstance(text_embedding, np.ndarray):
                    text_embedding = text_embedding.tolist()
                
                item = {
                    "id": doc.id,
                    "item_name": data.get("item_name", ""),
                    "image_url": data.get("image_url", ""),
                    "description": description,
                    "text_embedding": text_embedding,
                    "status": data.get("status", "available"),
                }
                
                optional_fields = ["location_found", "found_date", "category", 
                                  "last_seen_location", "date_lost", "reward"]
                for field in optional_fields:
                    if field in data:
                        item[field] = data[field]
                
                embeddings.append(item)

        elapsed_time = time.time() - start_time
        logger.info(f"Memuat {len(embeddings)} embeddings dari {collection} dalam {elapsed_time:.2f} detik")
        
        if items_without_embedding > 0:
            logger.info(f"Memperbarui {items_without_embedding} item yang belum memiliki text embedding")
            
        return embeddings
        
    except Exception as e:
        logger.error(f"Error memuat embeddings dari Firebase: {str(e)}")
        return []

def save_text_embedding_to_firebase(item_id, description):
    if not description:
        return False
    
    try:
        text_embedding = extract_text_features(description)
        db.collection("found_items").document(item_id).update({
            "text_embedding": text_embedding.tolist()
        })
        logger.info(f"Berhasil menyimpan text embedding untuk item {item_id}")
        return True
    except Exception as e:
        logger.error(f"Error menyimpan text embedding: {str(e)}")
        return False
    
def refresh_all_text_embeddings():
    try:
        start_time = time.time()
        docs = db.collection("found_items").stream()
        updated_count = 0
        failed_count = 0
        skipped_count = 0
        
        for doc in docs:
            data = doc.to_dict()
            description = data.get("description", "")
            
            if not description:
                skipped_count += 1
                continue
                
            try:
                text_embedding = extract_text_features(description)
                db.collection("found_items").document(doc.id).update({
                    "text_embedding": text_embedding.tolist()
                })
                updated_count += 1
            except Exception as e:
                logger.error(f"Error memperbarui embedding item {doc.id}: {str(e)}")
                failed_count += 1
        
        elapsed_time = time.time() - start_time
        
        result = {
            "updated_count": updated_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "elapsed_time": elapsed_time
        }
        
        logger.info(f"Refresh embeddings selesai dalam {elapsed_time:.2f} detik")
        logger.info(f"Berhasil: {updated_count}, Gagal: {failed_count}, Dilewati: {skipped_count}")
        
        return result
    
    except Exception as e:
        logger.error(f"Error refresh embeddings: {str(e)}")
        return {
            "updated_count": 0,
            "failed_count": 0,
            "skipped_count": 0,
            "error": str(e)
        }

def test_text_similarity(text1, text2):
    try:
        features1 = extract_text_features(text1)
        features2 = extract_text_features(text2)
        sim = cosine_similarity([features1], [features2])[0][0]
        preprocessed1 = preprocess_text(text1)
        preprocessed2 = preprocess_text(text2)
        words1 = set(preprocessed1.split())
        words2 = set(preprocessed2.split())
        common_words = words1.intersection(words2)
        word_overlap_ratio = len(common_words) / max(len(words1), len(words2), 1)
        jaccard_similarity = len(common_words) / len(words1.union(words2)) if words1.union(words2) else 0
        adjusted_sim = (sim * 0.6) + (word_overlap_ratio * 0.3) + (jaccard_similarity * 0.1)
        adjusted_sim = min(adjusted_sim, 1.0)
        
        return {
            "raw_similarity": float(sim),
            "adjusted_similarity": float(adjusted_sim),
            "word_overlap_ratio": float(word_overlap_ratio),
            "jaccard_similarity": float(jaccard_similarity),
            "common_words": list(common_words),
            "text1_words": list(words1),
            "text2_words": list(words2),
            "preprocessed_text1": preprocessed1,
            "preprocessed_text2": preprocessed2
        }
    except Exception as e:
        logger.error(f"Error saat menguji kemiripan teks: {str(e)}")
        return {
            "error": str(e),
            "raw_similarity": 0.0,
            "adjusted_similarity": 0.0
        }
    
def train_tfidf_with_data():
    try:
        descriptions = []
        found_docs = db.collection("found_items").stream()
        for doc in found_docs:
            data = doc.to_dict()
            description = data.get("description", "")
            if description:
                descriptions.append(description)
        
        lost_docs = db.collection("lost_items").stream()
        for doc in lost_docs:
            data = doc.to_dict()
            description = data.get("description", "")
            if description:
                descriptions.append(description)
        
        if len(descriptions) < 10:
            descriptions.extend([
                "botol minum warna biru dengan tutup hitam",
                "galon air mineral merek aqua 19 liter",
                "dompet kulit warna hitam berisi kartu",
                "tas ransel hitam dengan logo adidas",
                "laptop asus warna silver dengan stiker",
                "kunci motor honda vario jatuh di parkiran",
                "kacamata minus frame hitam",
                "jaket hoodie warna navy ukuran L",
                "handphone samsung galaxy hitam dengan case merah", 
                "jam tangan casio g-shock warna hitam"
            ])
        
        preprocessed = [preprocess_text(desc) for desc in descriptions]
        
        global vectorizer
        vectorizer.fit(preprocessed)
        
        with open("app/models/tfidf_vectorizer.pkl", "wb") as f:
            pickle.dump(vectorizer, f)
        
        logger.info(f"Vectorizer berhasil dilatih dengan {len(descriptions)} deskripsi")
        return len(descriptions)
        
    except Exception as e:
        logger.error(f"Error saat melatih TF-IDF: {str(e)}")
        return 0