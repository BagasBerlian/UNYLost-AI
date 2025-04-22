import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from app.services.firebase import db

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
resnet.eval()
resnet = torch.nn.Sequential(*list(resnet.children())[:-1])
resnet.to(device)

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

def load_embeddings():
    path = "app/embeddings/found_items_embeddings.pkl"
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return []

def find_similar_items(new_embedding, threshold=0.85):
    found_data = load_embeddings_from_firebase()
    similarities = []

    for item in found_data:
        sim = cosine_similarity([new_embedding], [item["embedding"]])[0][0]
        if sim >= threshold:
            similarities.append({**item, "score": float(sim)})

    return sorted(similarities, key=lambda x: x["score"], reverse=True)

def load_embeddings_from_firebase():
    docs = db.collection("found_items").stream()
    embeddings = []

    for doc in docs:
        data = doc.to_dict()
        embeddings.append({
            "id": doc.id,
            "item_name": data.get("item_name"),
            "image_url": data.get("image_url"),
            "embedding": np.array(data.get("embedding")),
        })

    return embeddings