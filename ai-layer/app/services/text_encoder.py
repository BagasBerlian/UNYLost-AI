from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pickle
import os
import re
from app.services.firebase import db


STOPWORDS_ID = set([
    'yang', 'dan', 'di', 'ke', 'pada', 'untuk', 'dengan', 'adalah', 'ini', 'itu',
    'atau', 'juga', 'dari', 'akan', 'tidak', 'telah', 'dalam', 'secara', 'sehingga',
    'oleh', 'saya', 'kamu', 'dia', 'mereka', 'kami', 'kita', 'ada', 'bisa', 'dapat',
    'sudah', 'belum', 'jika', 'kalau', 'namun', 'tetapi', 'maka', 'sebagai', 'karena',
    'ketika', 'apabila', 'seperti', 'sebuah', 'suatu', 'bahwa', 'sangat', 'lebih', 'kurang',
    'atas', 'bawah', 'kiri', 'kanan', 'depan', 'belakang', 'samping', 'luar', 'antara',
    'sekitar', 'melalui', 'terhadap', 'tentang', 'tanpa', 'setelah', 'sebelum', 'selama',
    'sementara', 'sejak', 'hingga', 'sampai', 'saat', 'waktu', 'ketika'
])  

vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 3), 
    max_features=15000, 
    min_df=1,  
    max_df=0.95, 
    stop_words=list(STOPWORDS_ID),  
    sublinear_tf=True,  
)

def preprocess_text(text):
    if not text:
        return ""
        
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fit_vectorizer(descriptions):
    global vectorizer
    preprocessed_descriptions = [preprocess_text(   ) for desc in descriptions]
    vectorizer.fit(preprocessed_descriptions)
    
    with open("app/models/tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)

def load_vectorizer():
    global vectorizer
    path = "app/models/tfidf_vectorizer.pkl"
    if os.path.exists(path):
        with open(path, "rb") as f:
            vectorizer = pickle.load(f)
            return True
    return False

def extract_text_features(text):
    preprocessed_text = preprocess_text(text)
    
    if not hasattr(vectorizer, 'vocabulary_') or vectorizer.vocabulary_ is None:
        if not load_vectorizer():
            sample_docs = [
                preprocessed_text,
                "dompet hitam berisi kartu mahasiswa",
                "laptop asus warna silver dengan stiker",
                "kunci motor honda dengan gantungan",
                "buku catatan berwarna merah", 
                "kartu tanda mahasiswa atas nama mahasiswa"
            ]
            fit_vectorizer(sample_docs)
    
    features = vectorizer.transform([preprocessed_text])
    return features.toarray()[0]

def find_similar_items_by_text(query_text, threshold=0.2):
    try:
        query_features = extract_text_features(query_text)
        found_data = load_text_embeddings_from_firebase()
        similarities = []

        for item in found_data:
            if "text_embedding" in item and len(item["text_embedding"]) > 0:
                sim = cosine_similarity([query_features], [item["text_embedding"]])[0][0]
                query_words = set(preprocess_text(query_text).split())
                desc_words = set(preprocess_text(item.get("description", "")).split())
                common_words = query_words.intersection(desc_words)
                word_overlap_ratio = len(common_words) / max(len(query_words), 1)
                adjusted_sim = sim * (1.0 + 0.5 * word_overlap_ratio)
                adjusted_sim = min(adjusted_sim, 1.0)
                
                if adjusted_sim >= threshold:
                    similarities.append({
                        **item, 
                        "score": float(adjusted_sim),
                        "match_type": "text",
                        "raw_score": float(sim) 
                    })

        return sorted(similarities, key=lambda x: x["score"], reverse=True)
    except Exception as e:
        print(f"Error in find_similar_items_by_text: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

def load_text_embeddings_from_firebase():
    docs = db.collection("found_items").stream()
    embeddings = []

    for doc in docs:
        data = doc.to_dict()
        description = data.get("description", "")
        
        if description and "text_embedding" not in data:
            text_embedding = extract_text_features(description)
            db.collection("found_items").document(doc.id).update({
                "text_embedding": text_embedding.tolist() 
            })
            data["text_embedding"] = text_embedding.tolist() 
        
        if description:
            text_embedding = data.get("text_embedding", [])
            if isinstance(text_embedding, np.ndarray):
                text_embedding = text_embedding.tolist()
            
            embeddings.append({
                "id": doc.id,
                "item_name": data.get("item_name", ""),
                "image_url": data.get("image_url", ""),
                "description": description,
                "text_embedding": text_embedding, 
                "location_found": data.get("location_found", ""),
                "found_date": data.get("found_date", ""),
                "category": data.get("category", ""),
            })

    return embeddings

def save_text_embedding_to_firebase(item_id, description):
    if not description:
        return
    text_embedding = extract_text_features(description)
    db.collection("found_items").document(item_id).update({
        "text_embedding": text_embedding.tolist()
    })
    
def refresh_all_text_embeddings():
    docs = db.collection("found_items").stream()
    updated_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        description = data.get("description", "")
        
        if description:
            text_embedding = extract_text_features(description)
            db.collection("found_items").document(doc.id).update({
                "text_embedding": text_embedding.tolist()
            })
            updated_count += 1
    
    return {"updated_count": updated_count}

def test_text_similarity(text1, text2):
    features1 = extract_text_features(text1)
    features2 = extract_text_features(text2)
    sim = cosine_similarity([features1], [features2])[0][0]
    words1 = set(preprocess_text(text1).split())
    words2 = set(preprocess_text(text2).split())
    common_words = words1.intersection(words2)
    word_overlap_ratio = len(common_words) / max(len(words1), len(words2), 1)
    adjusted_sim = sim * (1.0 + 0.5 * word_overlap_ratio)
    adjusted_sim = min(adjusted_sim, 1.0)
    
    return {
        "raw_similarity": float(sim),
        "adjusted_similarity": float(adjusted_sim),
        "word_overlap_ratio": float(word_overlap_ratio),
        "common_words": list(common_words),
        "text1_words": list(words1),
        "text2_words": list(words2)
    }
    
def train_tfidf_with_data():
    docs = db.collection("found_items").stream()
    descriptions = []
    
    for doc in docs:
        data = doc.to_dict()
        description = data.get("description", "")
        if description:
            descriptions.append(description)
    
    if len(descriptions) < 5:
        descriptions.extend([
            "botol minum warna biru dengan tutup hitam",
            "galon air mineral merek aqua 19 liter",
            "dompet kulit warna hitam berisi kartu",
            "tas ransel hitam dengan logo adidas",
            "laptop asus warna silver dengan stiker"
        ])
    
    global vectorizer
    preprocessed = [preprocess_text(desc) for desc in descriptions]
    vectorizer.fit(preprocessed)
    
    with open("app/models/tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    
    return len(descriptions)