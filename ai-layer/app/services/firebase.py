# pylint: disable=all
# type: ignore
# noqa

import firebase_admin
from firebase_admin import credentials, firestore


cred = credentials.Certificate("firebase_key/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
