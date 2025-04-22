from firebase_admin import storage
from app.services.firebase import db
import uuid
from datetime import datetime

def save_found_item(item_data, image_url=None, image_embedding=None, text_embedding=None):
    """Menyimpan item temuan ke Firebase dengan struktur lengkap"""
    item_id = item_data.get("id", str(uuid.uuid4()))
    
    data = {
        "item_name": item_data.get("item_name", ""),
        "category": item_data.get("category", ""),
        "description": item_data.get("description", ""),
        "location_found": item_data.get("location_found", ""),
        "date_found": item_data.get("date_found", datetime.now().isoformat()),
        "reporter_id": item_data.get("reporter_id", ""),
        "reporter_contact": item_data.get("reporter_contact", ""),
        "status": item_data.get("status", "pending"),
        "updated_at": datetime.now().isoformat()
    }
    
    if image_url:
        data["image_url"] = image_url
    
    if image_embedding is not None:
        data["embedding"] = image_embedding.tolist()
    
    if text_embedding is not None:
        data["text_embedding"] = text_embedding.tolist()
    
    db.collection("found_items").document(item_id).set(data, merge=True)
    
    return {"id": item_id, **data}

def save_lost_item(item_data, image_url=None, image_embedding=None, text_embedding=None):
    item_id = item_data.get("id", str(uuid.uuid4()))
    
    data = {
        "item_name": item_data.get("item_name", ""),
        "category": item_data.get("category", ""),
        "description": item_data.get("description", ""),
        "last_seen_location": item_data.get("last_seen_location", ""),
        "date_lost": item_data.get("date_lost", datetime.now().isoformat()),
        "owner_id": item_data.get("owner_id", ""),
        "owner_contact": item_data.get("owner_contact", ""),
        "status": item_data.get("status", "pending"),
        "reward": item_data.get("reward", ""),
        "updated_at": datetime.now().isoformat()
    }
    
    if image_url:
        data["image_url"] = image_url
    
    if image_embedding is not None:
        data["embedding"] = image_embedding.tolist()
    
    if text_embedding is not None:
        data["text_embedding"] = text_embedding.tolist()
    
    db.collection("lost_items").document(item_id).set(data, merge=True)
    
    return {"id": item_id, **data}

def get_item_by_id(item_id, collection="found_items"):
    # Mengambil item berdasarkan ID
    doc_ref = db.collection(collection).document(item_id)
    doc = doc_ref.get()
    
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    else:
        return None

def update_item_status(item_id, status, collection="found_items"):
    # Memperbarui status item
    db.collection(collection).document(item_id).update({
        "status": status,
        "updated_at": datetime.now().isoformat()
    })
    
    return {"message": f"Status updated to {status}"}