import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from io import BytesIO
import requests
from app.services.firebase import db

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
resnet.eval()
resnet = torch.nn.Sequential(*list(resnet.children())[:-1])
resnet.to(device)

# Preprocessing Resnet
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

def extract_features(image: Image.Image):
    img_t = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        features = resnet(img_t).squeeze().cpu().numpy()
    return features

def extract_features_from_url(url: str):
    response = requests.get(url)
    image = Image.open(BytesIO(response.content)).convert("RGB")
    return extract_features(image)

def load_embeddings_from_file():
    path = "app/embeddings/found_items_embeddings.pkl"
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return []

def load_embeddings_from_firebase():
    docs = db.collection("found_items").stream()
    embeddings = []

    for doc in docs:
        data = doc.to_dict()
        if "embedding" in data:
            embeddings.append({
                "id": doc.id,
                "item_name": data.get("item_name"),
                "image_url": data.get("image_url"),
                "description": data.get("description", ""),
                "embedding": np.array(data.get("embedding")),
                "location": data.get("location", ""), 
                "found_date": data.get("found_date", ""),  
                "category": data.get("category", ""), 
            })

    return embeddings

def find_similar_items(new_embedding, threshold=0.7):
    found_data = load_embeddings_from_firebase()
    similarities = []

    for item in found_data:
        sim = cosine_similarity([new_embedding], [item["embedding"]])[0][0]
        if sim >= threshold:
            similarities.append({
                **item, 
                "score": float(sim),
                "match_type": "image"
            })

    return sorted(similarities, key=lambda x: x["score"], reverse=True)

def save_embedding_to_firebase(item_data, embedding):
    item_data["embedding"] = embedding.tolist()
    doc_ref = db.collection("found_items").add(item_data)
    return doc_ref[1].id 

def augment_image(image):
    augmentations = [
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.RandomRotation(degrees=30),
        transforms.ColorJitter(brightness=0.2)
    ]
    
    augmented_images = [image] 
    for aug in augmentations:
        augmented_images.append(aug(image))
    
    return augmented_images

def save_embedding_with_augmentation(item_data, image):
    original_embedding = extract_features(image)
    item_data["embedding"] = original_embedding.tolist()
    
    doc_ref = db.collection("found_items").add(item_data)
    item_id = doc_ref[1].id
    
    augmented_images = augment_image(image)
    for i, aug_img in enumerate(augmented_images[1:]): 
        aug_embedding = extract_features(aug_img)
        aug_item = item_data.copy()
        aug_item["embedding"] = aug_embedding.tolist()
        aug_item["is_augmented"] = True
        aug_item["original_id"] = item_id
        aug_item["augmentation_type"] = f"aug_{i}"
        
        db.collection("found_items").add(aug_item)
    
    return item_id