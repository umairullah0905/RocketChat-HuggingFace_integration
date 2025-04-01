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



