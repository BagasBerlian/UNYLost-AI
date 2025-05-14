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
import logging
from app.services.firebase import db

logger = logging.getLogger(__name__)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

def load_mobilenet():
    try:
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        model.eval()
        model = torch.nn.Sequential(*list(model.children())[:-1])
        
        saved_model_path = "app/models/mobilenet_v3_small_feature_extractor.pth"
        if os.path.exists(saved_model_path):
            model.load_state_dict(torch.load(saved_model_path, map_location=device))
            logger.info("Loaded saved MobileNetV3-Small model")
        
        model.to(device)
        return model
    except Exception as e:
        logger.error(f"Error loading MobileNetV3-Small model: {str(e)}")
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        model.eval()
        model = torch.nn.Sequential(*list(model.children())[:-1])
        model.to(device)
        return model

model = load_mobilenet()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

def extract_features(image: Image.Image):
    try:
        img_t = transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            features = model(img_t).squeeze().cpu().numpy()
        return features
    except Exception as e:
        logger.error(f"Error extracting features: {str(e)}")
        raise

def extract_features_from_multiple_images(images):
    if not images:
        raise ValueError("No images provided for feature extraction")
    
    features_list = []
    for i, image in enumerate(images):
        try:
            features = extract_features(image)
            features_list.append(features)
            logger.debug(f"Extracted features from image {i+1}/{len(images)}, shape: {features.shape}")
        except Exception as e:
            logger.warning(f"Failed to extract features from image {i+1}: {str(e)}")
    
    if not features_list:
        raise ValueError("Failed to extract features from any images")
    
    mean_features = np.mean(features_list, axis=0)
    logger.info(f"Created mean features from {len(features_list)} images, shape: {mean_features.shape}")
    return mean_features

def extract_features_from_url(url: str):
    try:
        response = requests.get(url, timeout=10)
        image = Image.open(BytesIO(response.content)).convert("RGB")
        return extract_features(image)
    except Exception as e:
        logger.error(f"Error extracting features from URL {url}: {str(e)}")
        raise

def load_embeddings_from_firebase(collection="found_items"):
    try:
        docs = db.collection(collection).stream()
        embeddings = []

        for doc in docs:
            data = doc.to_dict()
            if "embedding" in data:
                embedding_array = np.array(data.get("embedding"))
                
                item_data = {
                    "id": doc.id,
                    "item_name": data.get("item_name", ""),
                    "image_url": data.get("image_url", ""),
                    "description": data.get("description", ""),
                    "embedding": embedding_array,
                    "location_found": data.get("location_found", ""), 
                    "found_date": data.get("found_date", ""),  
                    "category": data.get("category", ""),
                    "status": data.get("status", "available"),
                }
                
                if "additional_images" in data:
                    item_data["additional_images"] = data.get("additional_images", [])
                
                embeddings.append(item_data)

        logger.info(f"Loaded {len(embeddings)} embeddings from Firebase collection: {collection}")
        return embeddings
    except Exception as e:
        logger.error(f"Error loading embeddings from Firebase: {str(e)}")
        return []

def find_similar_items(new_embedding, threshold=0.3, collection="found_items"):
    try:
        found_data = load_embeddings_from_firebase(collection=collection)
        similarities = []

        for item in found_data:
            if item.get("status", "available") != "available":
                continue
                
            sim = cosine_similarity([new_embedding], [item["embedding"]])[0][0]
            
            if sim >= threshold:
                matching_item = item.copy()
                matching_item["score"] = float(sim)
                matching_item["match_type"] = "image"
                similarities.append(matching_item)

        sorted_similarities = sorted(similarities, key=lambda x: x["score"], reverse=True)
        logger.info(f"Found {len(sorted_similarities)} similar items with threshold {threshold}")
        return sorted_similarities
    except Exception as e:
        logger.error(f"Error finding similar items: {str(e)}")
        return []

def save_embedding_to_firebase(item_data, embedding):
    try:
        item_data["embedding"] = embedding.tolist()
        
        if "created_at" not in item_data:
            from datetime import datetime
            item_data["created_at"] = datetime.now().isoformat()
        
        doc_ref = db.collection("found_items").add(item_data)
        item_id = doc_ref[1].id
        
        logger.info(f"Saved new item with ID: {item_id}")
        return item_id
    except Exception as e:
        logger.error(f"Error saving embedding to Firebase: {str(e)}")
        raise

def augment_image(image):
    try:
        augmentations = [
            transforms.RandomHorizontalFlip(p=1.0),
            transforms.RandomRotation(degrees=15),
            transforms.RandomPerspective(distortion_scale=0.2, p=1.0),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.RandomAffine(degrees=10, translate=(0.1, 0.1), scale=(0.9, 1.1))
        ]
        
        augmented_images = [image] 
        
        for aug in augmentations:
            try:
                aug_img = aug(image)
                augmented_images.append(aug_img)
            except Exception as aug_error:
                logger.warning(f"Error during augmentation: {str(aug_error)}")
        
        logger.info(f"Created {len(augmented_images)} augmented images (including original)")
        return augmented_images
    except Exception as e:
        logger.error(f"Error augmenting image: {str(e)}")
        return [image]

def save_embedding_with_augmentation(item_data, image):
    try:
        original_embedding = extract_features(image)
        
        main_item = item_data.copy()
        main_item["embedding"] = original_embedding.tolist()
        
        doc_ref = db.collection("found_items").add(main_item)
        item_id = doc_ref[1].id
        
        augmented_images = augment_image(image)
        
        for i, aug_img in enumerate(augmented_images[1:]):
            try:
                aug_embedding = extract_features(aug_img)
                
                aug_item = item_data.copy()
                aug_item["embedding"] = aug_embedding.tolist()
                aug_item["is_augmented"] = True
                aug_item["original_id"] = item_id
                aug_item["augmentation_type"] = f"aug_{i}"
                
                db.collection("found_items").add(aug_item)
            except Exception as aug_error:
                logger.warning(f"Error saving augmentation {i}: {str(aug_error)}")
        
        logger.info(f"Saved item with ID {item_id} and {len(augmented_images)-1} augmentations")
        return item_id
    except Exception as e:
        logger.error(f"Error saving with augmentation: {str(e)}")
        raise