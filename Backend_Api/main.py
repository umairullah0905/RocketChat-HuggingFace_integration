from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from fastapi.responses import RedirectResponse
import os
from fastapi.responses import HTMLResponse
import logging
import secrets
from dotenv import load_dotenv


load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from fastapi import FastAPI, Request, HTTPException

import httpx
from routers import  get_models, pr_discussion, upload_file
app = FastAPI()

# Temporary session storage (Replace with Redis in production)
user_sessions: Dict[str, str] = {}  # { "user_id": "hf_token" }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



STATE_STORE = {}  # Temporary in-memory store for states
HF_CLIENT_ID = os.getenv("HF_CLIENT_ID")
HF_CLIENT_SECRET =  os.getenv("HF_CLIENT_SECRET")
CALLBACK_URL = "http://127.0.0.1:8000/oauth-callback"


@app.get("/auth/huggingface")
def auth_huggingface(request: Request):
    state = secrets.token_hex(16)
    STATE_STORE[state] = True  # Store state temporarily

    auth_url = (
        f"https://huggingface.co/oauth/authorize?client_id={HF_CLIENT_ID}"
        f"&response_type=code&redirect_uri={CALLBACK_URL}"
        f"&scope=openid%20profile%20email&state={state}"
    )
    return RedirectResponse(auth_url)




@app.get("/oauth-callback")
async def oauth_callback(request: Request, code: str, state: str):
    if state not in STATE_STORE:
        raise HTTPException(status_code=400, detail="Invalid state or state mismatch")

    del STATE_STORE[state]  # Remove state after validation

    token_endpoint = "https://huggingface.co/oauth/token"
    data = {
        "client_id": HF_CLIENT_ID,
        "client_secret": HF_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": CALLBACK_URL,
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_endpoint, data=data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch token")

        access_token = token_response.json().get("access_token")

        user_response = await client.get("https://huggingface.co/api/whoami-v2",
                                         headers={"Authorization": f"Bearer {access_token}"})
        if user_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch user info")

        username = user_response.json().get("name")

    return HTMLResponse(content=f"""
    <html>
    <head>
        <title>Hugging Face OAuth Token</title>
        <script>
            function copyToken() {{
                navigator.clipboard.writeText("{access_token}");
                alert("Access Token copied to clipboard!");
            }}
        </script>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 20px;
                text-align: center;
            }}
            .warning {{
                color: red;
                font-weight: bold;
            }}
            .token-box {{
                background: #f4f4f4;
                padding: 10px;
                margin: 10px auto;
                display: inline-block;
                border-radius: 5px;
            }}
            button {{
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 10px;
            }}
            button:hover {{
                background: #0056b3;
            }}
        </style>
    </head>
    <body>
        <h2>✅ Authentication Successful</h2>
        <p class="warning">⚠️ Warning: Do NOT share this token with anyone!</p>
        <div class="token-box">
            <strong>Access Token:</strong> <br>
            <code>{access_token}</code>
        </div>
        <br>
        <button onclick="copyToken()">📋 Copy Token</button>
    </body>
    </html>
    """)



app.include_router(get_models.router, prefix="/models", tags=["Model Management"])
app.include_router(pr_discussion.router, prefix="/create", tags=["PR & Discussion"])
app.include_router(upload_file.router, prefix="/upload", tags=["Upload file"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

# api = HfApi()

from fastapi.concurrency import run_in_threadpool


# @app.get("/get-models")
# async def list_models(token: str = Query(..., description="Hugging Face API token")):
#     try:
#         hf_api = HfApi(token=token)
#         user_info = hf_api.whoami()  # Get user info
#         username = user_info.get("name", "")
#         models = hf_api.list_models(author=username)  # Fetch only user-owned models
#         return {"models": [{"id": model.id, "created_at":model.created_at} for model in models]}  # Include 'name'
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#
# @app.get("/allmodels")
# async def list_models(token: str = Query(..., description="Hugging Face API token")):
#     try:
#         hf_api = HfApi(token=token)
#         models = await run_in_threadpool(hf_api.list_models, limit=10)  # Run in background thread
#         return {"models": [{"id": model.id, "name": model.id} for model in models]}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))






# class PullRequestData(BaseModel):
#     repo_id: str
#     title: str
#     token: str
#
# @app.post("/pull_request")
# async def post_pull_request(data: PullRequestData):
#     try:
#         # Create a pull request using the data received from the request body
#         pr = create_pull_request(
#             repo_id=data.repo_id,
#             title=data.title,
#             token=data.token,
#         )
#
#         # Return the PR details
#         return {"message": "Pull request created successfully", "repo_id": data.repo_id, "title": data.title}
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#
# class DiscussionCreateRequest(BaseModel):
#     repo_id: str
#     title: str
#     token: str  # ✅ Accept token directly from Rocket.Chat request
#
# @app.post("/create-discussion")
# async def create_new_discussion(request: DiscussionCreateRequest):
#     """ Create a new discussion on Hugging Face """
#     try:
#         discussion = create_discussion(
#             repo_id=request.repo_id,
#             title=request.title,
#             token=request.token  # ✅ Token comes from Rocket.Chat, not session storage
#         )
#
#         return {"discussion_num": discussion.num, "title": discussion.title, "status": discussion.status}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# UPLOAD_DIR = "temp_uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
#
#
#
# class UploadRequest(BaseModel):
#     file_url: str
#     repo_id: str
#     repo_type: str
#     path_in_repo: str
#     token: str
#
#
#
# @app.post("/upload_file_from_url")
# async def upload_file_from_url(request: UploadRequest):
#     """Downloads a file from a given URL and uploads it to a Hugging Face repository."""
#     try:
#         logger.info(f"Received Request: {request}")
#
#         # Download the file
#         response = requests.get(request.file_url, stream=True)
#         logger.info(f"Download Response Code: {response.status_code}")
#
#         if response.status_code != 200:
#             logger.error("Failed to download file from URL.")
#             raise HTTPException(status_code=400, detail="Failed to download file from URL.")
#
#         file_name = request.file_url.split("/")[-1]
#         file_path = os.path.join(UPLOAD_DIR, file_name)
#
#         logger.info(f"Saving file to: {file_path}")
#         with open(file_path, "wb") as file:
#             shutil.copyfileobj(response.raw, file)
#
#         # Upload to Hugging Face Hub
#         logger.info(f"Uploading {file_name} to Hugging Face Repo: {request.repo_id}")
#         api.upload_file(
#             path_or_fileobj=file_path,
#             path_in_repo=request.path_in_repo,
#             repo_id=request.repo_id,
#             repo_type=request.repo_type,
#             token=request.token
#         )
#         logger.info("File uploaded successfully!")
#
#         # Cleanup
#         os.remove(file_path)
#         logger.info("Temporary file removed")
#
#         return {"message": "File uploaded successfully", "repo_id": request.repo_id,
#                 "path_in_repo": request.path_in_repo}
#
#     except Exception as e:
#         logger.error(f"Error occurred: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))





# STATE_STORE = {}  # Temporary in-memory store for states
# HF_CLIENT_ID = "c5dc7a13-1ffb-4c2d-8c68-d6fa4ea99eb9"
# HF_CLIENT_SECRET =  "cc4aa90e-7425-4e8e-b8ef-1fbb02a2316d"
# CALLBACK_URL = "http://127.0.0.1:8000/oauth-callback"
#
#
# @app.get("/auth/huggingface")
# def auth_huggingface(request: Request):
#     state = secrets.token_hex(16)
#     STATE_STORE[state] = True  # Store state temporarily
#
#     auth_url = (
#         f"https://huggingface.co/oauth/authorize?client_id={HF_CLIENT_ID}"
#         f"&response_type=code&redirect_uri={CALLBACK_URL}"
#         f"&scope=openid%20profile%20email&state={state}"
#     )
#     return RedirectResponse(auth_url)
#
#
# from fastapi.responses import HTMLResponse
#
# @app.get("/oauth-callback")
# async def oauth_callback(request: Request, code: str, state: str):
#     if state not in STATE_STORE:
#         raise HTTPException(status_code=400, detail="Invalid state or state mismatch")
#
#     del STATE_STORE[state]  # Remove state after validation
#
#     token_endpoint = "https://huggingface.co/oauth/token"
#     data = {
#         "client_id": HF_CLIENT_ID,
#         "client_secret": HF_CLIENT_SECRET,
#         "grant_type": "authorization_code",
#         "code": code,
#         "redirect_uri": CALLBACK_URL,
#     }
#
#     async with httpx.AsyncClient() as client:
#         token_response = await client.post(token_endpoint, data=data)
#         if token_response.status_code != 200:
#             raise HTTPException(status_code=500, detail="Failed to fetch token")
#
#         access_token = token_response.json().get("access_token")
#
#         user_response = await client.get("https://huggingface.co/api/whoami-v2",
#                                          headers={"Authorization": f"Bearer {access_token}"})
#         if user_response.status_code != 200:
#             raise HTTPException(status_code=500, detail="Failed to fetch user info")
#
#         username = user_response.json().get("name")
#
#     return HTMLResponse(content=f"""
#     <html>
#     <head>
#         <title>Hugging Face OAuth Token</title>
#         <script>
#             function copyToken() {{
#                 navigator.clipboard.writeText("{access_token}");
#                 alert("Access Token copied to clipboard!");
#             }}
#         </script>
#         <style>
#             body {{
#                 font-family: Arial, sans-serif;
#                 margin: 20px;
#                 text-align: center;
#             }}
#             .warning {{
#                 color: red;
#                 font-weight: bold;
#             }}
#             .token-box {{
#                 background: #f4f4f4;
#                 padding: 10px;
#                 margin: 10px auto;
#                 display: inline-block;
#                 border-radius: 5px;
#             }}
#             button {{
#                 background: #007bff;
#                 color: white;
#                 border: none;
#                 padding: 10px 20px;
#                 cursor: pointer;
#                 font-size: 16px;
#                 margin-top: 10px;
#             }}
#             button:hover {{
#                 background: #0056b3;
#             }}
#         </style>
#     </head>
#     <body>
#         <h2>✅ Authentication Successful</h2>
#         <p class="warning">⚠️ Warning: Do NOT share this token with anyone!</p>
#         <div class="token-box">
#             <strong>Access Token:</strong> <br>
#             <code>{access_token}</code>
#         </div>
#         <br>
#         <button onclick="copyToken()">📋 Copy Token</button>
#     </body>
#     </html>
#     """)



# @app.get("/get-public-models")
# async def get_models(request: Request):
#     auth_header = request.headers.get("Authorization")
#     username_header = request.headers.get("X-Username")
#
#     if not auth_header or not username_header:
#         raise HTTPException(status_code=401, detail="Unauthorized: Please log in first")
#
#     access_token = auth_header.split(" ")[1] if " " in auth_header else auth_header
#     username = username_header
#
#     async with httpx.AsyncClient() as client:
#         models_response = await client.get(f"https://huggingface.co/api/models?owner={username}",
#                                            headers={"Authorization": f"Bearer {access_token}"})
#
#         if models_response.status_code != 200:
#             raise HTTPException(status_code=500, detail="Failed to fetch models")
#
#         models = models_response.json()
#
#     # Return only the top 5 models
#     return JSONResponse(content={"models": models[:5]})