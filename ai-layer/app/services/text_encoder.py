from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pickle
import os
from app.services.firebase import db

vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words='english',  
    ngram_range=(1, 2)     
)

def extract_text_features(text):
    print("Mengekstrak fitur dari teks menggunakan TF-IDF...")
    if not text or not isinstance(text, str):
        return np.zeros(1)
    
    text_vector = vectorizer.fit_transform([text])
    return text_vector.toarray()[0]

def load_text_embeddings():
    print("Memuat embedding teks dari file atau Firebase...")
    path = "app/embeddings/text_embeddings.pkl"
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return []

def find_similar_texts(query_text, threshold=0.6):
    print("Mencari teks serupa dalam database...")
    query_embedding = extract_text_features(query_text)
    
    texts_data = load_text_embeddings_from_firebase()
    similarities = []
    
    for item in texts_data:
        item_embedding = item.get("text_embedding")
        if item_embedding is not None:
            sim = cosine_similarity([query_embedding], [item_embedding])[0][0]
            if sim >= threshold:
                similarities.append({**item, "score": float(sim)})
    
    return sorted(similarities, key=lambda x: x["score"], reverse=True)

def load_text_embeddings_from_firebase():
    print("Memuat semua embedding teks dari Firebase...")
    docs = db.collection("found_items").stream()
    embeddings = []
    
    for doc in docs:
        data = doc.to_dict()
        if "description" in data and "text_embedding" in data:
            embeddings.append({
                "id": doc.id,
                "item_name": data.get("item_name"),
                "description": data.get("description"),
                "text_embedding": np.array(data.get("text_embedding")),
            })
    
    return embeddings

def store_text_embedding_to_firebase(item_id, item_name, description):
    print("Menyimpan embedding teks ke Firebase...")
    text_embedding = extract_text_features(description)
    
    db.collection("found_items").document(item_id).update({
        "description": description,
        "text_embedding": text_embedding.tolist()
    })
    
    return text_embedding