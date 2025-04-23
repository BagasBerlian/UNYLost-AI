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
    'ketika', 'apabila', 'seperti', 'sebuah', 'suatu', 'bahwa', 'sangat', 'lebih', 'kurang'
])

vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),
    max_features=10000,
    min_df=2,  
    max_df=0.9,
    stop_words=list(STOPWORDS_ID)
)

def preprocess_text(text):
    if not text:
        return ""
        
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

# Melatih vectorizer dengan kumpulan deskripsi
def fit_vectorizer(descriptions):
    global vectorizer
    preprocessed_descriptions = [preprocess_text(desc) for desc in descriptions]
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
            fit_vectorizer([preprocessed_text, "ini adalah data dummy"])
    
    features = vectorizer.transform([preprocessed_text])
    return features.toarray()[0]

def find_similar_items_by_text(query_text, threshold=0.3):
    query_features = extract_text_features(query_text)
    found_data = load_text_embeddings_from_firebase()
    similarities = []

    for item in found_data:
        if "text_embedding" in item:
            sim = cosine_similarity([query_features], [item["text_embedding"]])[0][0]
            if sim >= threshold:
                similarities.append({
                    **item, 
                    "score": float(sim),
                    "match_type": "text"
                })

    return sorted(similarities, key=lambda x: x["score"], reverse=True)

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
            data["text_embedding"] = text_embedding
        
        if description:
            embeddings.append({
                "id": doc.id,
                "item_name": data.get("item_name"),
                "image_url": data.get("image_url"),
                "description": description,
                "text_embedding": np.array(data.get("text_embedding", [])),
                "location": data.get("location", ""),
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