from app.services.image_encoder import extract_features, find_similar_items
from app.services.text_encoder import extract_text_features, find_similar_items_by_text
from PIL import Image
import numpy as np
from typing import List, Dict, Union, Optional

def find_items_hybrid(
    image: Optional[Image.Image] = None,
    text: Optional[str] = None,
    image_threshold: float = 0.7,
    text_threshold: float = 0.3,
    image_weight: float = 0.6,
    text_weight: float = 0.4,
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
    
    return results[:max_results]