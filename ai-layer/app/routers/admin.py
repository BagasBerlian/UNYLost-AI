# pylint: disable=all
# type: ignore
# noqa

from fastapi import APIRouter, Body, HTTPException
from app.services.firebase import db
from datetime import datetime
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/collections")
async def get_collections():
    try:
        collections = [coll.id for coll in db.collections()]
        return {
            "collections": collections,
            "count": len(collections)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting collections: {str(e)}")

@router.post("/collections")
async def create_collection(collection: str = Body(..., embed=True)):
    try:
        collections = [coll.id for coll in db.collections()]
        if collection in collections:
            return {
                "success": True,
                "message": f"Collection {collection} already exists",
                "exists": True
            }
        
        db.collection(collection).document('placeholder').set({
            'created_at': datetime.now().isoformat(),
            'placeholder': True
        })
        
        return {
            "success": True,
            "message": f"Collection {collection} created successfully",
            "exists": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating collection: {str(e)}")