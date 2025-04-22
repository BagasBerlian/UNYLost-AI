from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def dummy_text_match():
    return {"message": "Text matching endpoint (placeholder)"}
