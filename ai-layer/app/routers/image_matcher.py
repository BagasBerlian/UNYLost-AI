# pylint: disable=all
# type: ignore
# noqa

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Query, Body
from typing import List, Optional
from PIL import Image
from io import BytesIO
import os
import uuid
from datetime import datetime
import traceback
import logging
from app.services.firebase import db
from app.services.firebase_storage import get_item_by_id, update_item_status
from app.services.upload_to_drive import upload_to_drive
from app.services.image_encoder import (
    extract_features, 
    extract_features_from_multiple_images,
    find_similar_items, 
    save_embedding_to_firebase
)
from app.services.text_encoder import save_text_embedding_to_firebase
from app.services.feedback_learner import get_optimal_thresholds

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/image-matcher", tags=["Image Matching"])

@router.post("/match")
async def match_image(
    file: UploadFile = File(None),
    threshold: float = Form(None),
    include_details: bool = Form(False)
):
    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")
    
    try:
        file_content = await file.read()
        image = Image.open(BytesIO(file_content)).convert("RGB")
        
        embedding = extract_features(image)
        
        if threshold is None:
            optimal_thresholds = get_optimal_thresholds()
            threshold = optimal_thresholds.get("image_threshold", 0.3)
        
        logger.info(f"Using image matching threshold: {threshold}")
        
        matches = find_similar_items(embedding, threshold=threshold)
        logger.info(f"Found {len(matches)} matches with threshold {threshold}")
        
        all_items = find_similar_items(embedding, threshold=0.1)
        logger.debug("All potential matches (threshold=0.1):")
        for item in all_items[:10]:  # Tampilkan 10 teratas
            logger.debug(f"  - {item['item_name']}: {item['score']}")
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
            
            if not include_details and "description" in match and len(match["description"]) > 100:
                match["description"] = match["description"][:100] + "..."
        
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
        
        return {
            "matches": matches,
            "threshold_used": threshold,
            "total_matches": len(matches)
        }
        
    except Exception as e:
        logger.error(f"Error in image matching: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/add-found-item")
async def add_found_item(
    item_name: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    category: str = Form(...),
    files: List[UploadFile] = File(...),
    reporter_name: Optional[str] = Form(None),
    reporter_contact: Optional[str] = Form(None),
    reporter_id: Optional[str] = Form(None)
):
    try:
        if not isinstance(files, list):
            files = [files]
            
        if len(files) < 1:
            raise HTTPException(status_code=400, detail="At least one image file is required")
        
        images = []
        file_paths = []
        
        for file in files:
            file_content = await file.read()
            try:
                image = Image.open(BytesIO(file_content)).convert("RGB")
                images.append(image)
                
                os.makedirs("temp_images", exist_ok=True)
                file_path = f"temp_images/{uuid.uuid4()}_{file.filename}"
                with open(file_path, "wb") as f:
                    f.write(file_content)
                file_paths.append(file_path)
            except Exception as img_error:
                logger.error(f"Error processing image {file.filename}: {str(img_error)}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error processing image {file.filename}: {str(img_error)}"
                )
        
        image_url = upload_to_drive(file_paths[0], files[0].filename)
        
        additional_image_urls = []
        if len(file_paths) > 1:
            for i in range(1, len(file_paths)):
                additional_url = upload_to_drive(file_paths[i], files[i].filename)
                additional_image_urls.append(additional_url)
        
        embedding = extract_features_from_multiple_images(images)
        
        item_data = {
            "item_name": item_name,
            "description": description,
            "location_found": location,
            "category": category,
            "image_url": image_url,
            "additional_images": additional_image_urls,
            "found_date": str(datetime.now().date()),
            "status": "available",
            "created_at": datetime.now().isoformat()
        }
        
        if reporter_name:
            item_data["reporter_name"] = reporter_name
        
        if reporter_contact:
            item_data["reporter_contact"] = reporter_contact
            
        if reporter_id:
            item_data["reporter_id"] = reporter_id
        
        item_id = save_embedding_to_firebase(item_data, embedding)
        
        save_text_embedding_to_firebase(item_id, description)
        
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        return {
            "success": True,
            "item_id": item_id,
            "image_url": image_url,
            "additional_images": additional_image_urls,
            "message": "Found item added successfully"
        }
        
    except Exception as e:
        logger.error(f"Error adding found item: {str(e)}")
        if 'file_paths' in locals():
            for file_path in file_paths:
                if os.path.exists(file_path):
                    os.remove(file_path)
        
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error adding found item: {str(e)}")

@router.get("/items/{item_id}")
async def get_item_details(item_id: str, include_embeddings: bool = False):    
    try:
        item = get_item_by_id(item_id, collection="found_items")
        
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")
        
        if not include_embeddings:
            if "embedding" in item:
                del item["embedding"]
            if "text_embedding" in item:
                del item["text_embedding"]
        
        return item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting item details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting item details: {str(e)}")

@router.put("/items/{item_id}/status")
async def update_item_status(
    item_id: str, 
    status: str = Form(...),
    claimed_by: Optional[str] = Form(None)
):  
    try:
        valid_statuses = ["available", "claimed", "returned", "expired"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        update_data = {"status": status}
        if claimed_by and status == "claimed":
            update_data["claimed_by"] = claimed_by
            update_data["claimed_at"] = datetime.now().isoformat()
        
        result = update_item_status(item_id, update_data, collection="found_items")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating item status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating item status: {str(e)}")

@router.post("/multi-match")
async def match_multiple_images(
    files: List[UploadFile] = File(...),
    threshold: float = Form(None)
):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No image files provided")
    
    try:
        images = []
        for file in files:
            file_content = await file.read()
            image = Image.open(BytesIO(file_content)).convert("RGB")
            images.append(image)
        
        embedding = extract_features_from_multiple_images(images)
        
        if threshold is None:
            optimal_thresholds = get_optimal_thresholds()
            threshold = optimal_thresholds.get("image_threshold", 0.3)
        
        matches = find_similar_items(embedding, threshold=threshold)
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
        
        return {
            "matches": matches,
            "images_processed": len(images),
            "threshold_used": threshold,
            "total_matches": len(matches)
        }
        
    except Exception as e:
        logger.error(f"Error in multi-image matching: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing images: {str(e)}")

@router.post("/items/{item_id}/images")
async def add_item_images(
    item_id: str,
    files: List[UploadFile] = File(...),
):
    try:
        item = get_item_by_id(item_id, collection="found_items")
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")
        
        images = []
        file_paths = []
        
        for file in files:
            file_content = await file.read()
            try:
                image = Image.open(BytesIO(file_content)).convert("RGB")
                images.append(image)
                
                os.makedirs("temp_images", exist_ok=True)
                file_path = f"temp_images/{uuid.uuid4()}_{file.filename}"
                with open(file_path, "wb") as f:
                    f.write(file_content)
                file_paths.append(file_path)
            except Exception as img_error:
                logger.error(f"Error processing image {file.filename}: {str(img_error)}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error processing image {file.filename}: {str(img_error)}"
                )
        
        image_urls = []
        for file_path in file_paths:
            image_url = upload_to_drive(file_path, os.path.basename(file_path))
            image_urls.append(image_url)
        
        current_item_data = db.collection("found_items").document(item_id).get().to_dict()
        
        if "additional_images" in current_item_data:
            additional_images = current_item_data["additional_images"]
        else:
            additional_images = []
        
        additional_images.extend(image_urls)
        
        db.collection("found_items").document(item_id).update({
            "additional_images": additional_images,
            "updated_at": datetime.now().isoformat()
        })
        
        for file_path in file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        return {
            "success": True,
            "item_id": item_id,
            "image_urls": image_urls,
            "total_images": len(additional_images) + 1,  
            "message": "Images added successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding images to item: {str(e)}")
        traceback.print_exc()
        
        if 'file_paths' in locals():
            for file_path in file_paths:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    
        raise HTTPException(status_code=500, detail=f"Error adding images to item: {str(e)}")
    
@router.delete("/items/{item_id}/images")
async def delete_item_image(item_id: str, image_url: str = Body(..., embed=True)):
    try:
        logger.info(f"Menghapus gambar dari item {item_id}: {image_url}")
        
        item = get_item_by_id(item_id, collection="found_items")
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")
        
        additional_images = item.get("additional_images", [])
        primary_image_url = item.get("image_url", "")
        
        if image_url == primary_image_url:
            if additional_images:
                new_primary = additional_images[0]
                additional_images.remove(new_primary)
                
                db.collection("found_items").document(item_id).update({
                    "image_url": new_primary,
                    "additional_images": additional_images,
                    "updated_at": datetime.now().isoformat()
                })
                
                logger.info(f"Gambar utama dihapus, diganti dengan {new_primary}")
                return {
                    "success": True,
                    "message": "Primary image deleted and replaced",
                    "new_primary": new_primary,
                    "remaining_images": additional_images
                }
            else:
                db.collection("found_items").document(item_id).update({
                    "image_url": "",
                    "updated_at": datetime.now().isoformat()
                })
                
                logger.info("Gambar utama dihapus, tidak ada gambar pengganti")
                return {
                    "success": True,
                    "message": "Primary image deleted, no replacement available",
                    "remaining_images": []
                }
        elif image_url in additional_images:
            additional_images.remove(image_url)
            
            db.collection("found_items").document(item_id).update({
                "additional_images": additional_images,
                "updated_at": datetime.now().isoformat()
            })
            
            logger.info(f"Gambar tambahan dihapus: {image_url}")
            return {
                "success": True,
                "message": "Additional image deleted successfully",
                "remaining_images": additional_images,
                "primary_image": primary_image_url
            }
        else:
            logger.warning(f"Gambar tidak ditemukan: {image_url}")
            raise HTTPException(status_code=404, detail="Image not found in item images")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting item image: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting item image: {str(e)}")
    
@router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    try:
        logger.info(f"Menghapus item dengan ID: {item_id}")
        
        item = get_item_by_id(item_id, collection="found_items")
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")
        
        db.collection("found_items").document(item_id).delete()
        
        logger.info(f"Item {item_id} berhasil dihapus dari Firestore")
        return {
            "success": True,
            "message": f"Item with ID {item_id} successfully deleted",
            "item_id": item_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting item: {str(e)}")
    
@router.put("/items/{item_id}/primary-image")
async def set_primary_image(item_id: str, image_url: str = Body(..., embed=True)):
    try:
        logger.info(f"Mengatur gambar utama untuk item {item_id}: {image_url}")
        
        item = get_item_by_id(item_id, collection="found_items")
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")
        
        additional_images = item.get("additional_images", [])
        current_primary = item.get("image_url", "")
        
        if image_url == current_primary:
            return {
                "success": True,
                "message": "Image is already the primary image",
                "image_url": image_url
            }
        
        update_data = {}
        
        if image_url in additional_images:
            additional_images.remove(image_url)
            update_data["additional_images"] = additional_images
            
            if current_primary and current_primary not in additional_images:
                additional_images.append(current_primary)
                update_data["additional_images"] = additional_images
        
        update_data["image_url"] = image_url
        update_data["updated_at"] = datetime.now().isoformat()
        
        db.collection("found_items").document(item_id).update(update_data)
        
        logger.info(f"Gambar utama berhasil diubah untuk item {item_id}")
        return {
            "success": True,
            "message": "Primary image successfully updated",
            "previous_primary": current_primary,
            "new_primary": image_url,
            "additional_images": update_data.get("additional_images", additional_images)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting primary image: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error setting primary image: {str(e)}")