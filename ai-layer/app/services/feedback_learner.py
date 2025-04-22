from app.services.firebase import db
from datetime import datetime

def record_match_feedback(match_id, is_correct, user_id=None):
    feedback_data = {
        "match_id": match_id,
        "is_correct": is_correct,
        "user_id": user_id,
        "timestamp": datetime.now().isoformat()
    }
    
    db.collection("match_feedback").add(feedback_data)
    
    return {"message": "Feedback recorded successfully"}

def analyze_feedback():
    # Ambil semua feedback
    feedback_docs = db.collection("match_feedback").stream()
    feedback_data = [{"id": doc.id, **doc.to_dict()} for doc in feedback_docs]
    
    # Hitung rasio keberhasilan
    correct_matches = sum(1 for item in feedback_data if item.get("is_correct"))
    total_matches = len(feedback_data)
    
    accuracy = correct_matches / total_matches if total_matches > 0 else 0
    
    # {Logika untuk menyesuaikan threshold}
        
    return {
        "accuracy": accuracy,
        "total_feedback": total_matches,
        "correct_matches": correct_matches
    }