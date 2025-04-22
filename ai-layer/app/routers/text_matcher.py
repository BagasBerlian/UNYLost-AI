from fastapi import APIRouter, Body
from app.services.text_encoder import extract_text_features, find_similar_texts, store_text_embedding_to_firebase
from typing import Dict, Optional

router = APIRouter(prefix="/text-matcher", tags=["Text Matching"])

@router.post("/")
async def match_text(data: Dict[str, str] = Body(...)):
    description = data.get("description", "")
    if not description:
        return {"error": "Description is required", "matches": []}
    
    matches = find_similar_texts(description)
    
    return {"matches": matches}

@router.post("/store")
async def store_text(data: Dict[str, str] = Body(...)):
    item_id = data.get("id")
    item_name = data.get("item_name", "")
    description = data.get("description", "")
    
    if not item_id or not description:
        return {"error": "ID and description are required"}
    
    embedding = store_text_embedding_to_firebase(item_id, item_name, description)
    
    return {"message": "Text embedding saved successfully", "embedding_size": len(embedding)}