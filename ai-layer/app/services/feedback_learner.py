from app.services.firebase import db
from firebase_admin import firestore
from datetime import datetime, timedelta
import logging
import numpy as np
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)

def record_match_feedback(match_id: str, is_correct: bool, user_id: Optional[str] = None, 
                         match_type: Optional[str] = "hybrid", 
                         match_score: Optional[float] = None,
                         item_category: Optional[str] = None) -> Dict[str, Any]:
    try:
        feedback_data = {
            "match_id": match_id,
            "is_correct": is_correct,
            "timestamp": datetime.now(),
            "match_type": match_type,
            "match_score": match_score
        }
        
        if user_id:
            feedback_data["user_id"] = user_id
            
        if item_category:
            feedback_data["item_category"] = item_category
        
        db.collection("match_feedback").add(feedback_data)
        
        try:
            match_ref = db.collection("matches").document(match_id)
            match_doc = match_ref.get()
            
            if match_doc.exists:
                match_ref.update({
                    "feedback_count": firestore.Increment(1),
                    "correct_count": firestore.Increment(1 if is_correct else 0),
                    "last_feedback": datetime.now(),
                    "is_correct": is_correct  
                })
        except Exception as e:
            logger.warning(f"Error updating match statistics: {str(e)}")
        
        update_global_thresholds()
        
        return {"message": "Feedback recorded successfully", "feedback_id": feedback_data.get("id")}
    
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        return {"error": f"Failed to record feedback: {str(e)}"}

def get_recent_feedback(limit: int = 50, days: int = 30) -> List[Dict[str, Any]]:
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        query = db.collection("match_feedback") \
                .where("timestamp", ">=", cutoff_date) \
                .order_by("timestamp", direction=firestore.Query.DESCENDING) \
                .limit(limit)
                
        feedback_docs = query.stream()
        
        feedback_data = []
        for doc in feedback_docs:
            data = doc.to_dict()
            data["id"] = doc.id
            feedback_data.append(data)
            
        logger.info(f"Retrieved {len(feedback_data)} recent feedback entries")
        return feedback_data
        
    except Exception as e:
        logger.error(f"Error getting recent feedback: {str(e)}")
        return []

def analyze_feedback() -> Dict[str, Any]:
    try:
        feedback_docs = get_recent_feedback(limit=1000, days=30)
        
        if not feedback_docs:
            return {
                "message": "No feedback data available for analysis",
                "accuracy": 0.0,
                "total_feedback": 0
            }
        
        total_matches = len(feedback_docs)
        correct_matches = sum(1 for item in feedback_docs if item.get("is_correct", False))
        accuracy = correct_matches / total_matches if total_matches > 0 else 0
        
        match_types = {}
        for item in feedback_docs:
            match_type = item.get("match_type", "unknown")
            if match_type not in match_types:
                match_types[match_type] = {"total": 0, "correct": 0}
            
            match_types[match_type]["total"] += 1
            if item.get("is_correct", False):
                match_types[match_type]["correct"] += 1
        
        match_type_accuracy = {}
        for match_type, counts in match_types.items():
            match_type_accuracy[match_type] = counts["correct"] / counts["total"] if counts["total"] > 0 else 0
        
        category_accuracy = {}
        categories = {}
        for item in feedback_docs:
            category = item.get("item_category", "unknown")
            if category not in categories:
                categories[category] = {"total": 0, "correct": 0}
            
            categories[category]["total"] += 1
            if item.get("is_correct", False):
                categories[category]["correct"] += 1
        
        for category, counts in categories.items():
            category_accuracy[category] = counts["correct"] / counts["total"] if counts["total"] > 0 else 0
        
        score_ranges = {
            "0.9-1.0": {"total": 0, "correct": 0},
            "0.8-0.9": {"total": 0, "correct": 0},
            "0.7-0.8": {"total": 0, "correct": 0},
            "0.6-0.7": {"total": 0, "correct": 0},
            "0.5-0.6": {"total": 0, "correct": 0},
            "0.4-0.5": {"total": 0, "correct": 0},
            "0.3-0.4": {"total": 0, "correct": 0},
            "0.2-0.3": {"total": 0, "correct": 0},
            "0.1-0.2": {"total": 0, "correct": 0},
            "0.0-0.1": {"total": 0, "correct": 0},
        }
        
        for item in feedback_docs:
            score = item.get("match_score", 0)
            if score is None:
                continue
                
            for score_range in score_ranges:
                lower, upper = map(float, score_range.split("-"))
                if lower <= score < upper or (upper == 1.0 and score == 1.0):
                    score_ranges[score_range]["total"] += 1
                    if item.get("is_correct", False):
                        score_ranges[score_range]["correct"] += 1
                    break
        
        score_accuracy = {}
        for score_range, counts in score_ranges.items():
            score_accuracy[score_range] = counts["correct"] / counts["total"] if counts["total"] > 0 else 0
        
        return {
            "accuracy": accuracy,
            "total_feedback": total_matches,
            "correct_matches": correct_matches,
            "match_type_stats": match_types,
            "match_type_accuracy": match_type_accuracy,
            "category_accuracy": category_accuracy,
            "score_accuracy": score_accuracy,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing feedback: {str(e)}")
        return {
            "error": f"Failed to analyze feedback: {str(e)}",
            "accuracy": 0.0,
            "total_feedback": 0
        }

def update_global_thresholds() -> Dict[str, Any]:
    try:
        analysis = analyze_feedback()
        
        if "error" in analysis or analysis.get("total_feedback", 0) < 10:
            return {
                "image_threshold": 0.3,
                "text_threshold": 0.3,
                "hybrid_weight_image": 0.4,
                "hybrid_weight_text": 0.6
            }
        
        match_type_accuracy = analysis.get("match_type_accuracy", {})
        score_accuracy = analysis.get("score_accuracy", {})
        optimal_threshold = 0.3 
        highest_accuracy = 0.0
        
        for score_range, accuracy in score_accuracy.items():
            if accuracy > highest_accuracy and accuracy > 0:
                highest_accuracy = accuracy
                optimal_threshold = float(score_range.split("-")[0])
        
        overall_accuracy = analysis.get("accuracy", 0.0)
        
        if overall_accuracy < 0.3:
            image_threshold = max(0.2, optimal_threshold - 0.1)
            text_threshold = max(0.2, optimal_threshold - 0.1)
        elif overall_accuracy < 0.5:
            image_threshold = max(0.25, optimal_threshold - 0.05)
            text_threshold = max(0.25, optimal_threshold - 0.05)
        elif overall_accuracy > 0.8:
            image_threshold = min(0.4, optimal_threshold + 0.1)
            text_threshold = min(0.4, optimal_threshold + 0.1)
        elif overall_accuracy > 0.7:
            image_threshold = min(0.35, optimal_threshold + 0.05)
            text_threshold = min(0.35, optimal_threshold + 0.05)
        else:
            image_threshold = optimal_threshold
            text_threshold = optimal_threshold
        
        hybrid_weight_image = 0.4  
        hybrid_weight_text = 0.6  
        
        if match_type_accuracy.get("image", 0) > match_type_accuracy.get("text", 0):
            if match_type_accuracy.get("image", 0) > 0.7:
                hybrid_weight_image = 0.6
                hybrid_weight_text = 0.4
            else:
                hybrid_weight_image = 0.5
                hybrid_weight_text = 0.5
        elif match_type_accuracy.get("text", 0) > match_type_accuracy.get("image", 0):
            if match_type_accuracy.get("text", 0) > 0.7:
                hybrid_weight_image = 0.3
                hybrid_weight_text = 0.7
            else:
                hybrid_weight_image = 0.4
                hybrid_weight_text = 0.6
        
        thresholds = {
            "image_threshold": round(image_threshold, 2),
            "text_threshold": round(text_threshold, 2),
            "hybrid_weight_image": round(hybrid_weight_image, 2),
            "hybrid_weight_text": round(hybrid_weight_text, 2),
            "updated_at": datetime.now(),
            "based_on_feedback": analysis.get("total_feedback", 0),
            "overall_accuracy": overall_accuracy
        }
        
        db.collection("system_settings").document("matching_thresholds").set(thresholds)
        
        logger.info(f"Updated global thresholds: {thresholds}")
        return thresholds
        
    except Exception as e:
        logger.error(f"Error updating global thresholds: {str(e)}")
        return {
            "image_threshold": 0.3,
            "text_threshold": 0.3,
            "hybrid_weight_image": 0.4,
            "hybrid_weight_text": 0.6
        }

def get_optimal_thresholds() -> Dict[str, Any]:
    try:
        threshold_doc = db.collection("system_settings").document("matching_thresholds").get()
        
        if threshold_doc.exists:
            thresholds = threshold_doc.to_dict()
            updated_at = thresholds.get("updated_at")
            if updated_at and (datetime.now() - updated_at).days > 1:
                return update_global_thresholds()
            return thresholds
        else:
            return update_global_thresholds()
            
    except Exception as e:
        logger.error(f"Error getting optimal thresholds: {str(e)}")
        return {
            "image_threshold": 0.3,
            "text_threshold": 0.3,
            "hybrid_weight_image": 0.4,
            "hybrid_weight_text": 0.6
        }

def get_matching_stats() -> Dict[str, Any]:
    try:
        analysis = analyze_feedback()
        found_items_query = db.collection("found_items").count()
        found_items_count = len(list(found_items_query.get()))
        lost_items_query = db.collection("lost_items").count()
        lost_items_count = len(list(lost_items_query.get()))
        matches_query = db.collection("matches").where("is_correct", "==", True).count()
        successful_matches = len(list(matches_query.get()))
        success_rate = successful_matches / (found_items_count + lost_items_count) if (found_items_count + lost_items_count) > 0 else 0
        
        thresholds = get_optimal_thresholds()
        
        return {
            "found_items_count": found_items_count,
            "lost_items_count": lost_items_count,
            "successful_matches": successful_matches,
            "success_rate": success_rate,
            "feedback_accuracy": analysis.get("accuracy", 0),
            "current_thresholds": thresholds,
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting matching stats: {str(e)}")
        return {
            "error": f"Failed to get matching stats: {str(e)}",
            "found_items_count": 0,
            "lost_items_count": 0,
            "successful_matches": 0
        }