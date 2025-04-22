from fastapi import APIRouter, UploadFile, File, Form
from PIL import Image
from app.services.upload_to_drive import upload_to_drive
from app.services.image_encoder import extract_features, find_similar_items
from app.services.text_encoder import find_similar_texts
from io import BytesIO
import os
import json

router = APIRouter(prefix="/hybrid-matcher", tags=["Hybrid Matching"])

@router.post("/")
async def match_hybrid(
    file: UploadFile = File(None),
    description: str = Form(""),
    item_name: str = Form(""),
    category: str = Form("")
):
    image_matches = []
    text_matches = []
    
    if file:
        image = Image.open(BytesIO(await file.read())).convert("RGB")
        image_embedding = extract_features(image)
        image_matches = find_similar_items(image_embedding)
    
    if description:
        text_matches = find_similar_texts(description)
    
    if not image_matches and file:
        file_path = f"temp_images/{file.filename}"
        os.makedirs("temp_images", exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.seek(0)
            f.write(await file.read())
            
        image_url = upload_to_drive(file_path, file.filename)
        print(f"✅ Gambar berhasil diupload ke: {image_url}")
    
    combined_matches = []
    
    if image_matches and text_matches:
        image_match_ids = [match["id"] for match in image_matches]
        
        for text_match in text_matches:
            if text_match["id"] in image_match_ids:
                image_score = next((match["score"] for match in image_matches if match["id"] == text_match["id"]), 0)
                combined_score = (text_match["score"] + image_score) / 2
                combined_matches.append({
                    **text_match,
                    "image_score": image_score,
                    "text_score": text_match["score"],
                    "score": combined_score,
                    "match_type": "hybrid"
                })
    
    for match in image_matches:
        if not any(item["id"] == match["id"] for item in combined_matches):
            combined_matches.append({**match, "match_type": "image_only"})
            
    for match in text_matches:
        if not any(item["id"] == match["id"] for item in combined_matches):
            combined_matches.append({**match, "match_type": "text_only"})
    
    combined_matches.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "matches": combined_matches,
        "image_matches_count": len(image_matches),
        "text_matches_count": len(text_matches)
    }