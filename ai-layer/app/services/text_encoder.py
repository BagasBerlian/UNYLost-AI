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
    'adalah', 'setelah', 'sebelum', 'selama', 'sesudah', 'melalui', 'terhadap'
])

vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 3), 
    max_features=20000,
    min_df=1,  
    max_df=0.9,
    stop_words=list(STOPWORDS_ID)
)

def preprocess_text(text):
    if not text:
        return ""
        
    text = text.lower()
    
    keywords = ["botol", "galon", "minum", "air", "dompet", "tas", "hitam", "merah", "biru", "putih"]
    for keyword in keywords:
        if keyword in text:
            text = text.replace(keyword, f" {keyword} ")
    
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    print(f"Preprocessed text: '{text}'")
    return text

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

def find_similar_items_by_text(query_text, threshold=0.2):
    try:
        query_features = extract_text_features(query_text)
        found_data = load_text_embeddings_from_firebase()
        similarities = []

        for item in found_data:
            if "text_embedding" in item:
                try:
                    text_embedding = np.array(item["text_embedding"])
                    if query_features.shape[0] != text_embedding.shape[0]:
                        if "description" in item and item["description"]:
                            text_embedding = extract_text_features(item["description"])
                            db.collection("found_items").document(item["id"]).update({
                                "text_embedding": text_embedding.tolist()
                            })
                    
                    sim = float(cosine_similarity([query_features], [text_embedding])[0][0])
                    
                    if sim >= threshold:
                        matching_item = {
                            "id": item.get("id", ""),
                            "item_name": item.get("item_name", ""),
                            "description": item.get("description", ""),
                            "score": sim,
                            "match_type": "text"
                        }
                        
                        for field in ["category", "location_found", "found_date", "image_url"]:
                            if field in item:
                                matching_item[field] = item[field]
                        
                        similarities.append(matching_item)
                        
                except Exception as e:
                    print(f"Error calculating similarity for item {item.get('id')}: {str(e)}")
                    continue

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