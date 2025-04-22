import pickle
from PIL import Image
from app.services.image_encoder import extract_features

image = Image.open("Icon_unylost.png").convert("RGB")

embedding = extract_features(image)

data = [
    {
        "id": 1,
        "item_name": "Logo UNYLost",
        "embedding": embedding
    }
]

with open("app/embeddings/Icon_unylost.pkl", "wb") as f:
    pickle.dump(data, f)

# print(embedding)
print("✅ Embedding berhasil dibuat dan disimpan.")
