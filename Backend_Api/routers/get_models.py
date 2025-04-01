from fastapi import APIRouter, Query, HTTPException, Request
from huggingface_hub import HfApi
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
import httpx
import starlette
router = APIRouter()




@router.get("/get-models")
async def list_models(token: str = Query(..., description="Hugging Face API token")):
    try:
        hf_api = HfApi(token=token)
        user_info = hf_api.whoami()  # Get user info
        username = user_info.get("name", "")
        models = hf_api.list_models(author=username)  # Fetch only user-owned models
        return {"models": [{"id": model.id, "created_at":model.created_at} for model in models]}  # Include 'name'
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/allmodels")
async def list_models(token: str = Query(..., description="Hugging Face API token")):
    try:
        hf_api = HfApi(token=token)
        models = await run_in_threadpool(hf_api.list_models, limit=10)  # Run in background thread
        return {"models": [{"id": model.id, "name": model.id} for model in models]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/get-public-models")
async def get_models(request: Request):
    auth_header = request.headers.get("Authorization")
    username_header = request.headers.get("X-Username")

    if not auth_header or not username_header:
        raise HTTPException(status_code=401, detail="Unauthorized: Please log in first")

    access_token = auth_header.split(" ")[1] if " " in auth_header else auth_header
    username = username_header

    async with httpx.AsyncClient() as client:
        models_response = await client.get(f"https://huggingface.co/api/models?owner={username}",
                                           headers={"Authorization": f"Bearer {access_token}"})

        if models_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch models")

        models = models_response.json()

    # Return only the top 5 models
    return JSONResponse(content={"models": models[:5]})