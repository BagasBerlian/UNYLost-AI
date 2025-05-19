# pylint: disable=all
# type: ignore
# noqa

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import mimetypes

SERVICE_ACCOUNT_FILE = 'firebase_key/serviceAccountKey.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

FOLDER_ID = '1J9Gh_oqfmPoH8z5ODNbVpeXpD7QOV341'

def upload_to_drive(file_path: str, file_name: str):
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)

    service = build('drive', 'v3', credentials=credentials)

    mime_type, _ = mimetypes.guess_type(file_path)

    file_metadata = {
        'name': file_name,
        'parents': [FOLDER_ID]
    }
    media = MediaFileUpload(file_path, mimetype=mime_type)

    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    file_id = file.get('id')

    service.permissions().create(
        fileId=file_id,
        body={'type': 'anyone', 'role': 'reader'}
    ).execute()

    direct_link = f"https://drive.google.com/uc?id={file_id}&export=download"

    return direct_link


