from fastapi import APIRouter, UploadFile, File
from PIL import Image
from app.services.upload_to_drive import upload_to_drive
from app.services.image_encoder import extract_features, find_similar_items
from io import BytesIO
import os

router = APIRouter(prefix="/image-matcher", tags=["Image Matching"])

@router.post("/")
async def match_image(file: UploadFile = File(...)):
    image = Image.open(BytesIO(await file.read())).convert("RGB")

    embedding = extract_features(image)

    matches = find_similar_items(embedding)

    print("🚀 Trying to upload to Drive...")
    
    if not matches:
        file_path = f"temp_images/{file.filename}"
        os.makedirs("temp_images", exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        url = upload_to_drive(file_path, file.filename)

        print("✅ Uploaded to Drive at:", url)

    return {"matches": matches}
