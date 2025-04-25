from app.services.image_encoder import extract_features, find_similar_items
from app.services.text_encoder import extract_text_features, find_similar_items_by_text
from app.services.feedback_learner import get_recent_feedback
from app.services.firebase import db
from PIL import Image
import numpy as np
from typing import List, Dict, Union, Optional
import logging

logger = logging.getLogger(__name__)

def find_items_hybrid(
    image: Optional[Image.Image] = None,
    text: Optional[str] = None,
    image_threshold: float = 0.3,  
    text_threshold: float = 0.3,
    image_weight: float = 0.4,  
    text_weight: float = 0.6,  
    max_results: int = 10
) -> List[Dict]:
    if image is None and not text:
        raise ValueError("Setidaknya satu dari gambar atau teks harus disediakan")
    
    total_weight = image_weight + text_weight
    image_weight = image_weight / total_weight
    text_weight = text_weight / total_weight
    
    adaptive_thresholds = update_thresholds_based_on_feedback()
    if adaptive_thresholds:
        if image_threshold == 0.3:  
            image_threshold = adaptive_thresholds["image_threshold"]
        if text_threshold == 0.3:  
            text_threshold = adaptive_thresholds["text_threshold"]
    
    logger.info(f"Menggunakan threshold: image={image_threshold}, text={text_threshold}")
    logger.info(f"Menggunakan bobot: image={image_weight}, text={text_weight}")
    
    hybrid_results = {}
    
    if image is not None:
        image_embedding = extract_features(image)
        image_matches = find_similar_items(image_embedding, threshold=image_threshold)
        
        for item in image_matches:
            item_id = item["id"]
            hybrid_results[item_id] = {
                **item,
                "image_score": item["score"],
                "hybrid_score": item["score"] * image_weight,
                "match_types": ["image"]
            }
            
        logger.info(f"Ditemukan {len(image_matches)} kecocokan gambar")
    
    if text:
        text_matches = find_similar_items_by_text(text, threshold=text_threshold)
        
        for item in text_matches:
            item_id = item["id"]
            
            if item_id in hybrid_results:
                hybrid_results[item_id]["text_score"] = item["score"]
                hybrid_results[item_id]["hybrid_score"] += item["score"] * text_weight
                hybrid_results[item_id]["match_types"].append("text")
            else:
                hybrid_results[item_id] = {
                    **item,
                    "text_score": item["score"],
                    "hybrid_score": item["score"] * text_weight,
                    "match_types": ["text"]
                }
                
        logger.info(f"Ditemukan {len(text_matches)} kecocokan teks")
    
    if len(hybrid_results) < 3:
        logger.info("Hasil terlalu sedikit, mencoba dengan threshold yang lebih rendah")
        return find_items_hybrid_with_fallback(
            image, text, 
            image_threshold * 0.7, text_threshold * 0.7,
            image_weight, text_weight, max_results
        )
    
    results = list(hybrid_results.values())
    results.sort(key=lambda x: x["hybrid_score"], reverse=True)
    
    for item in results:
        if "image" in item["match_types"] and "text" in item["match_types"]:
            item["match_type"] = "hybrid"
        elif "image" in item["match_types"]:
            item["match_type"] = "image"
        else:
            item["match_type"] = "text"
    
    return results[:max_results]

def find_items_hybrid_with_fallback(
    image: Optional[Image.Image] = None,
    text: Optional[str] = None,
    image_threshold: float = 0.2,  
    text_threshold: float = 0.2,
    image_weight: float = 0.4,
    text_weight: float = 0.6,
    max_results: int = 10
) -> List[Dict]:
    if image is None and not text:
        raise ValueError("Setidaknya satu dari gambar atau teks harus disediakan")
    
    total_weight = image_weight + text_weight
    image_weight = image_weight / total_weight
    text_weight = text_weight / total_weight
    
    hybrid_results = {}
    
    if image is not None:
        image_embedding = extract_features(image)
        image_matches = find_similar_items(image_embedding, threshold=image_threshold)
        
        for item in image_matches:
            item_id = item["id"]
            hybrid_results[item_id] = {
                **item,
                "image_score": item["score"],
                "hybrid_score": item["score"] * image_weight,
                "match_types": ["image"]
            }
    
    if text:
        text_matches = find_similar_items_by_text(text, threshold=text_threshold)
        
        for item in text_matches:
            item_id = item["id"]
            
            if item_id in hybrid_results:
                hybrid_results[item_id]["text_score"] = item["score"]
                hybrid_results[item_id]["hybrid_score"] += item["score"] * text_weight
                hybrid_results[item_id]["match_types"].append("text")
            else:
                hybrid_results[item_id] = {
                    **item,
                    "text_score": item["score"],
                    "hybrid_score": item["score"] * text_weight,
                    "match_types": ["text"]
                }
    
    results = list(hybrid_results.values())
    results.sort(key=lambda x: x["hybrid_score"], reverse=True)
    
    for item in results:
        if "image" in item["match_types"] and "text" in item["match_types"]:
            item["match_type"] = "hybrid"
        elif "image" in item["match_types"]:
            item["match_type"] = "image"
        else:
            item["match_type"] = "text"
    
    logger.info(f"Fallback menemukan {len(results)} kecocokan dengan threshold lebih rendah")
    return results[:max_results]

def update_thresholds_based_on_feedback():
    try:
        feedbacks = get_recent_feedback(50) 
        
        if not feedbacks or len(feedbacks) < 10:
            return {
                "image_threshold": 0.3,
                "text_threshold": 0.3
            }
        
        correct_matches = sum(1 for f in feedbacks if f.get("is_correct", False))
        total_matches = len(feedbacks)
        accuracy = correct_matches / total_matches if total_matches > 0 else 0
        
        if accuracy < 0.3:  
            return {
                "image_threshold": 0.2,
                "text_threshold": 0.2
            }
        elif accuracy < 0.5:  
            return {
                "image_threshold": 0.25,
                "text_threshold": 0.25
            }
        elif accuracy > 0.8:  
            return {
                "image_threshold": 0.4,
                "text_threshold": 0.4
            }
        elif accuracy > 0.7:  
            return {
                "image_threshold": 0.35,
                "text_threshold": 0.35
            }
        else:  
            return {
                "image_threshold": 0.3,
                "text_threshold": 0.3
            }
    except Exception as e:
        logger.error(f"Error updating thresholds based on feedback: {str(e)}")
        return {
            "image_threshold": 0.3,
            "text_threshold": 0.3
        }