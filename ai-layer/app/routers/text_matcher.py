from fastapi import APIRouter, HTTPException, Form, Query, Body
from app.services.text_encoder import (
    find_similar_items_by_text, 
    test_text_similarity,
    refresh_all_text_embeddings
)
from typing import Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/text-matcher", tags=["Text Matching"])

class TestSimilarityRequest(BaseModel):
    text1: str
    text2: str

@router.post("/match")
async def match_text(
    query: str = Form(...),
    threshold: float = Form(0.2 ),
    max_results: int = Form(10)
):
    try:
        if not query:
            raise HTTPException(status_code=400, detail="Query text is required")
            
        if threshold < 0 or threshold > 1:
            raise HTTPException(status_code=400, detail="Threshold must be between 0 and 1")
            
        if max_results < 1:
            raise HTTPException(status_code=400, detail="Max results must be at least 1")
            
        matches = find_similar_items_by_text(query, threshold=threshold)
        
        matches = matches[:max_results]
        
        return {
            "query": query,
            "matches": matches,
            "total_matches": len(matches)
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error matching text: {str(e)}")

@router.get("/search")
async def search_text(
    q: str = Query(..., description="Query text to search for"),
    threshold: float = Query(0.2, description="Minimum similarity threshold"),
    max_results: int = Query(10, description="Maximum number of results to return")
):
    try:
        if not q:
            raise HTTPException(status_code=400, detail="Query text is required")
            
        if threshold < 0 or threshold > 1:
            raise HTTPException(status_code=400, detail="Threshold must be between 0 and 1")
            
        if max_results < 1:
            raise HTTPException(status_code=400, detail="Max results must be at least 1")
            
        matches = find_similar_items_by_text(q, threshold=threshold)
        
        matches = matches[:max_results]
        
        return {
            "query": q,
            "matches": matches,
            "total_matches": len(matches)
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error searching text: {str(e)}")

@router.post("/test-similarity")
async def test_similarity(request: TestSimilarityRequest):
    try:
        result = test_text_similarity(request.text1, request.text2)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing text similarity: {str(e)}")
    

@router.post("/refresh-embeddings")
async def refresh_embeddings():
    try:
        result = refresh_all_text_embeddings()
        return {
            "success": True,
            "message": f"Successfully refreshed {result['updated_count']} text embeddings",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing text embeddings: {str(e)}")