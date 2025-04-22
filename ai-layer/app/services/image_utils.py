import torch
from torchvision import models, transforms
from PIL import Image
import requests
from io import BytesIO
import numpy as np
import pickle

model = models.resnet50(pretrained=True)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def get_image_embedding(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content)).convert("RGB")
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        features = model(tensor)
    return features.squeeze().numpy()

def find_best_match(query_embedding):
    with open("data/image_embeddings.pkl", "rb") as f:
        db = pickle.load(f)
    
    similarities = [(item["id"], cosine_similarity(query_embedding, item["embedding"])) for item in db]
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[0]

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
