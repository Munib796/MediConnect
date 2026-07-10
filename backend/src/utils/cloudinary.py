import cloudinary
import cloudinary.uploader

from src.utils.settings import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_file_to_cloudinary(file_bytes: bytes, filename: str, folder: str) -> str:
    clean_filename = filename
    for ext in [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"]:
        if clean_filename.lower().endswith(ext):
            clean_filename = clean_filename[: -len(ext)]

    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=clean_filename,
        folder=folder,
        resource_type="auto",
        overwrite=True,
    )
    return result["secure_url"]