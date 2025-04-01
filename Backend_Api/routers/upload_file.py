from fastapi import APIRouter, HTTPException
from huggingface_hub import HfApi
from pydantic import BaseModel
import os
import logging
import requests
import shutil
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)




router = APIRouter()

api = HfApi()


UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



class UploadRequest(BaseModel):
    file_url: str
    repo_id: str
    repo_type: str
    path_in_repo: str
    token: str


@router.post("/upload_file_from_url")
async def upload_file_from_url(request: UploadRequest):
    """Downloads a file from a given URL and uploads it to a Hugging Face repository."""
    try:
        logger.info(f"Received Request: {request}")

        # Download the file
        response = requests.get(request.file_url, stream=True)
        logger.info(f"Download Response Code: {response.status_code}")

        if response.status_code != 200:
            logger.error("Failed to download file from URL.")
            raise HTTPException(status_code=400, detail="Failed to download file from URL.")

        file_name = request.file_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, file_name)

        logger.info(f"Saving file to: {file_path}")
        with open(file_path, "wb") as file:
            shutil.copyfileobj(response.raw, file)

        # Upload to Hugging Face Hub
        logger.info(f"Uploading {file_name} to Hugging Face Repo: {request.repo_id}")
        api.upload_file(
            path_or_fileobj=file_path,
            path_in_repo=request.path_in_repo,
            repo_id=request.repo_id,
            repo_type=request.repo_type,
            token=request.token
        )
        logger.info("File uploaded successfully!")

        # Cleanup
        os.remove(file_path)
        logger.info("Temporary file removed")

        return {"message": "File uploaded successfully", "repo_id": request.repo_id,
                "path_in_repo": request.path_in_repo}

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))