from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from PIL import Image
from app.services.upload_to_drive import upload_to_drive
from app.services.image_encoder import extract_features, find_similar_items, save_embedding_to_firebase
from app.services.text_encoder import save_text_embedding_to_firebase
from io import BytesIO
import os
from typing import Optional
import uuid
from datetime import datetime
import traceback
import json

router = APIRouter(prefix="/image-matcher", tags=["Image Matching"])

# Endpoint untuk pencocokan barang
@router.post("/match")
async def match_image(file: UploadFile = File(None)):
    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")
    
    try:
        file_content = await file.read()
        image = Image.open(BytesIO(file_content)).convert("RGB")
        embedding = extract_features(image)
        threshold = 0.7
        matches = find_similar_items(embedding,threshold=threshold)
        
        print(f"Using threshold: {threshold}")
        print(f"Found {len(matches)} matches")
        
        all_items = find_similar_items(embedding, threshold=0.1)
        print("All potential matches (threshold=0.1):")
        for item in all_items:
            print(f"  - {item['item_name']}: {item['score']}")
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
        
        if not matches:
            os.makedirs("temp_images", exist_ok=True)
            file_path = f"temp_images/{uuid.uuid4()}_{file.filename}"
            with open(file_path, "wb") as f:
                f.write(file_content)

            url = upload_to_drive(file_path, file.filename)
            os.remove(file_path)
            
            return {
                "matches": [],
                "message": "No matches found. Image saved for future matching.",
                "image_url": url
            }
        
        # Logging
        print("Matches before return:", json.dumps([{k: str(v) for k, v in m.items()} for m in matches], indent=2))
        
        return {"matches": matches}
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Endpoint untuk menambahkan barang temuan baru
@router.post("/add-found-item")
async def add_found_item(
    item_name: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        file_content = await file.read()
        image = Image.open(BytesIO(file_content)).convert("RGB")
        os.makedirs("temp_images", exist_ok=True)
        file_path = f"temp_images/{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        image_url = upload_to_drive(file_path, file.filename)
        embedding = extract_features(image)
        
        item_data = {
            "item_name": item_name,
            "description": description,
            "location": location,
            "category": category,
            "image_url": image_url,
            "found_date": str(datetime.now().date())
        }
        item_id = save_embedding_to_firebase(item_data, embedding)
        
        save_text_embedding_to_firebase(item_id, description)
        
        os.remove(file_path)
        
        return {
            "success": True,
            "item_id": item_id,
            "image_url": image_url,
            "message": "Found item added successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding found item: {str(e)}")