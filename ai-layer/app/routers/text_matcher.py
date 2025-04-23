from fastapi import APIRouter, HTTPException, Form, Query
from app.services.text_encoder import find_similar_items_by_text
from typing import Optional

router = APIRouter(prefix="/text-matcher", tags=["Text Matching"])

@router.post("/match")
async def match_text(
    query: str = Form(...),
    threshold: float = Form(0.3),
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
    threshold: float = Query(0.3, description="Minimum similarity threshold"),
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