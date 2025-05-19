# pylint: disable=all
# type: ignore
# noqa

from fastapi import APIRouter, UploadFile, File, Form, Body, Query, HTTPException
from PIL import Image
from io import BytesIO
import os
import uuid
from datetime import datetime
import traceback
import logging
from typing import Optional, List, Dict
import numpy as np

from app.services.firebase import db
from app.services.upload_to_drive import upload_to_drive
from app.services.image_encoder import extract_features
from app.services.text_encoder import extract_text_features
from app.services.hybrid_matcher import find_items_hybrid
from app.services.text_encoder import find_similar_items_by_text
from app.services.firebase_storage import save_lost_item

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lost-items", tags=["Lost Items"])

@router.post("/add")
async def add_lost_item(
    item_name: str = Form(...),
    description: str = Form(""),
    last_seen_location: str = Form(""),
    category: str = Form(...),
    date_lost: str = Form(...),
    file: UploadFile = File(...),
    owner_id: Optional[str] = Form(None),
    owner_contact: Optional[str] = Form(None),
    reward: Optional[str] = Form(None)
):
    try:
        logger.info(f"Menambahkan lost item: {item_name}")
        
        file_content = await file.read()
        image = Image.open(BytesIO(file_content)).convert("RGB")
        
        os.makedirs("temp_images", exist_ok=True)
        file_path = f"temp_images/{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        image_url = upload_to_drive(file_path, file.filename)
        
        embedding = extract_features(image)
        text_embedding = None
        if description:
            text_embedding = extract_text_features(description)
        
        item_data = {
            "item_name": item_name,
            "description": description,
            "last_seen_location": last_seen_location,
            "category": category,
            "date_lost": date_lost,
            "image_url": image_url,
            "status": "active",
            "created_at": datetime.now().isoformat()
        }
        
        if owner_id:
            item_data["owner_id"] = owner_id
        
        if owner_contact:
            item_data["owner_contact"] = owner_contact
            
        if reward:
            item_data["reward"] = reward
        
        result = save_lost_item(item_data, image_url, embedding, text_embedding)
        
        matches = find_items_hybrid(
            image=image,
            text=description,
            image_threshold=0.7,
            text_threshold=0.2,
            collection="found_items"
        )
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
        
        return {
            "success": True,
            "item_id": result["id"],
            "image_url": image_url,
            "matches": matches[:5], 
            "message": "Lost item added successfully"
        }
        
    except Exception as e:
        logger.error(f"Error adding lost item: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error adding lost item: {str(e)}")

@router.post("/add-text")
async def add_lost_item_text(
    item_data: dict = Body(...)
):
    try:
        logger.info(f"Menambahkan lost item (text only): {item_data.get('item_name', '')}")
        
        text_embedding = None
        description = item_data.get("description", "")
        if description:
            text_embedding = extract_text_features(description)
        
        result = save_lost_item(item_data, None, None, text_embedding)
        
        matches = []
        if description:
            matches = find_similar_items_by_text(
                description,
                threshold=0.2,
                collection="found_items"
            )
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
        
        return {
            "success": True,
            "item_id": result["id"],
            "matches": matches[:5],  
            "message": "Lost item added successfully (text only)"
        }
        
    except Exception as e:
        logger.error(f"Error adding lost item (text only): {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error adding lost item: {str(e)}")