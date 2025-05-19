# pylint: disable=all
# type: ignore
# noqa

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.routers import image_matcher, text_matcher, hybrid_matcher, lost_items
import os
from app.services.text_encoder import train_tfidf_with_data
from app.services.text_encoder import extract_text_features, load_text_embeddings_from_firebase, preprocess_text
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.services.firebase import db

os.makedirs("app/models", exist_ok=True)
os.makedirs("app/embeddings", exist_ok=True)
os.makedirs("temp_images", exist_ok=True)

app = FastAPI(
    title="UNYLost AI API",
    description="API untuk mencari barang hilang dan temuan dengan AI",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dalam produksi, ganti dengan domain yang diizinkan
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_matcher.router)
app.include_router(text_matcher.router)
app.include_router(hybrid_matcher.router)
app.include_router(lost_items.router)

@app.get("/")
async def root():
    return {
        "app": "UNYLost AI API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "image_matching": "/image-matcher/match",
            "found_item_add": "/image-matcher/add-found-item",
            "text_matching": "/text-matcher/match",
            "text_search": "/text-matcher/search",
            "hybrid_matching": "/hybrid-matcher/match",
            "hybrid_search": "/hybrid-matcher/search"
        }
    }

@app.get("/debug-text", tags=["Debugging"])
async def debug_text_matching(query: str = Query(...)):
    try:
        items = load_text_embeddings_from_firebase()
        processed_query = preprocess_text(query)
        query_features = extract_text_features(query)
        results = []
        for item in items:
            if "text_embedding" in item and len(item["text_embedding"]) > 0:
                text_embedding = np.array(item["text_embedding"]) if isinstance(item["text_embedding"], list) else item["text_embedding"]
                sim = float(cosine_similarity([query_features], [text_embedding])[0][0])
                
                results.append({
                    "id": item.get("id", ""),
                    "item_name": item.get("item_name", ""),
                    "description": item.get("description", ""),
                    "similarity": sim,
                })
        
        results = sorted(results, key=lambda x: x["similarity"], reverse=True)
        
        return {
            "original_query": query,
            "processed_query": processed_query,
            "total_items": len(items),
            "items_with_text_embedding": sum(1 for item in items if "text_embedding" in item and len(item["text_embedding"]) > 0),
            "top_matches": results[:10]  
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug-retrain")
async def debug_retrain():
    count = train_tfidf_with_data()
    return {"message": f"Retrained TF-IDF with {count} descriptions"}

@app.get("/debug-items")
async def debug_items():
    docs = db.collection("found_items").stream()
    items = []
    
    for doc in docs:
        data = doc.to_dict()
        items.append({
            "id": doc.id,
            "item_name": data.get("item_name", ""),
            "description": data.get("description", ""),
            "has_embedding": "embedding" in data,
            "has_text_embedding": "text_embedding" in data
        })
    
    return {"items": items}

@app.get("/debug-regenerate-embeddings")
async def debug_regenerate_embeddings():
    docs = db.collection("found_items").stream()
    updated = 0
    
    for doc in docs:
        data = doc.to_dict()
        description = data.get("description", "")
        
        if description:
            text_embedding = extract_text_features(description)
            db.collection("found_items").document(doc.id).update({
                "text_embedding": text_embedding.tolist()
            })
            updated += 1
    
    return {"message": f"Regenerated text embeddings for {updated} items"}

@app.get("/simple-search")
async def simple_search(q: str = Query(...), threshold: float = 0.1):
    from app.services.firebase import db
    
    query = q.lower().strip()
    docs = db.collection("found_items").stream()
    matches = []
    
    for doc in docs:
        data = doc.to_dict()
        item_name = data.get("item_name", "").lower()
        description = data.get("description", "").lower()
        
        if query in item_name or query in description:
            score = 1.0 if query in item_name else 0.8
            
            matches.append({
                "id": doc.id,
                "item_name": data.get("item_name", ""),
                "description": data.get("description", ""),
                "category": data.get("category", ""),
                "location_found": data.get("location_found", ""),
                "found_date": data.get("found_date", ""),
                "image_url": data.get("image_url", ""),
                "score": score,
                "match_type": "simple_text"
            })
    
    matches = sorted(matches, key=lambda x: x["score"], reverse=True)
    
    return {
        "query": q,
        "matches": matches,
        "total_matches": len(matches)
    }