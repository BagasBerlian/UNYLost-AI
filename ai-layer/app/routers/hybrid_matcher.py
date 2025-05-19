# pylint: disable=all
# type: ignore
# noqa

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from PIL import Image
from app.services.hybrid_matcher import find_items_hybrid
from io import BytesIO
from typing import Optional
import json
import requests
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hybrid-matcher", tags=["Hybrid Matching"])

@router.post("/match")
async def hybrid_match(
    file: Optional[UploadFile] = File(None),
    query: str = Form(None),
    image_threshold: float = Form(0.7),  
    text_threshold: float = Form(0.2),
    image_weight: float = Form(0.4), 
    text_weight: float = Form(0.6),
    max_results: int = Form(10),
    collection: str = Form("found_items")  
):
    try:
        if not file and not query:
            raise HTTPException(
                status_code=400, 
                detail="At least one of file or query text must be provided"
            )
            
        if collection not in ["found_items", "lost_items"]:
            raise HTTPException(
                status_code=400,
                detail="Collection must be either 'found_items' or 'lost_items'"
            )
            
        if image_threshold < 0 or image_threshold > 1:
            raise HTTPException(status_code=400, detail="Image threshold must be between 0 and 1")
            
        if text_threshold < 0 or text_threshold > 1:
            raise HTTPException(status_code=400, detail="Text threshold must be between 0 and 1")
            
        if image_weight < 0 or text_weight < 0:
            raise HTTPException(status_code=400, detail="Weights must be positive values")
            
        if max_results < 1:
            raise HTTPException(status_code=400, detail="Max results must be at least 1")
        
        image = None
        if file:
            file_content = await file.read()
            image = Image.open(BytesIO(file_content)).convert("RGB")
        
        matches = find_items_hybrid(
            image=image,
            text=query,
            image_threshold=image_threshold,
            text_threshold=text_threshold,
            image_weight=image_weight,
            text_weight=text_weight,
            max_results=max_results,
            collection=collection
        )
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
        
        return {
            "image_provided": file is not None,
            "text_provided": query is not None,
            "collection": collection,  
            "matches": matches,
            "total_matches": len(matches),
            "parameters": {
                "image_threshold": image_threshold,
                "text_threshold": text_threshold,
                "image_weight": image_weight,
                "text_weight": text_weight
            }
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        import traceback
        logger.error(f"Error in hybrid matching: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error in hybrid matching: {str(e)}")

@router.get("/search")
async def hybrid_search(
    q: Optional[str] = Query(None, description="Text query"),
    image_url: Optional[str] = Query(None, description="URL of image to match"),
    image_threshold: float = Query(0.7, description="Minimum image similarity threshold"),
    text_threshold: float = Query(0.3, description="Minimum text similarity threshold"),
    image_weight: float = Query(0.6, description="Weight for image similarity score"),
    text_weight: float = Query(0.4, description="Weight for text similarity score"),
    max_results: int = Query(10, description="Maximum number of results")
):
    try:
        if not q and not image_url:
            raise HTTPException(
                status_code=400, 
                detail="At least one of text query or image URL must be provided"
            )
            
        if image_threshold < 0 or image_threshold > 1:
            raise HTTPException(status_code=400, detail="Image threshold must be between 0 and 1")
            
        if text_threshold < 0 or text_threshold > 1:
            raise HTTPException(status_code=400, detail="Text threshold must be between 0 and 1")
            
        if image_weight < 0 or text_weight < 0:
            raise HTTPException(status_code=400, detail="Weights must be positive values")
            
        if max_results < 1:
            raise HTTPException(status_code=400, detail="Max results must be at least 1")
        
        image = None
        if image_url:
            try:
                response = requests.get(image_url, timeout=10)
                image = Image.open(BytesIO(response.content)).convert("RGB")
            except Exception as img_error:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error fetching or processing image from URL: {str(img_error)}"
                )
        
        matches = find_items_hybrid(
            image=image,
            text=q,
            image_threshold=image_threshold,
            text_threshold=text_threshold,
            image_weight=image_weight,
            text_weight=text_weight,
            max_results=max_results
        )
        
        for match in matches:
            if "embedding" in match:
                del match["embedding"]
            if "text_embedding" in match:
                del match["text_embedding"]
        
        return {
            "image_provided": image_url is not None,
            "text_provided": q is not None,
            "matches": matches,
            "total_matches": len(matches),
            "parameters": {
                "image_threshold": image_threshold,
                "text_threshold": text_threshold,
                "image_weight": image_weight,
                "text_weight": text_weight
            }
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error in hybrid searching: {str(e)}")