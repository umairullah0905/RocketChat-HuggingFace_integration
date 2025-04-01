<h1>This repository contains a Rocket.Chat App Engine SDK integration with Hugging Face and a FastAPI backend API, allowing users to interact with Hugging Face models, datasets, and Spaces directly from Rocket.Chat.</h1>
📦 HuggingFace-RocketChat-Integration  
│  
├── 📂 BackendAPI  (FastAPI backend)  
│   ├── 📜 main.py  (Entry point for FastAPI)  
│   ├── 📂 router  (Contains all API routes)  
│   │   ├── pull_request.py  (API for creating pull requests)  
│   │   ├── discussion.py  (API for creating discussions)  
│   │   ├── file_upload.py  (API for uploading files)  
│  
├── 📂 Hugging-FaceAPI  (Rocket.Chat App)  
│   ├── 📜 huggingfaceapiapp.ts  (Main entry file, includes all commands)  
│   ├── 📂 commands  (Contains all Rocket.Chat commands)  
│   ├── 📂 utils  (Utility files)  
│   │   ├── encryption.ts  (Encrypts user tokens)  
│   │   ├── storage.ts  (Session-based token storage)  
│  
└── 📜 README.md  (Project documentation)  
 FastAPI Backend (BackendAPI)
✅ Create Pull Requests – API to initiate pull requests on Hugging Face repositories.

✅ Create Discussions – API to open discussions on Hugging Face forums.

✅ File Upload – API to upload files to Hugging Face.

💬 Rocket.Chat App (Hugging-FaceAPI)
🔹 Slash Commands – Execute Hugging Face actions from Rocket.Chat.

🔹 Secure OAuth Token Storage – Uses session-based storage for security.

🔹 Encryption – User tokens are securely stored using encryption techniqu

Tech Stack
FastAPI – Backend API for Hugging Face interactions.

Rocket.Chat App Engine SDK – For building and deploying Rocket.Chat apps.

TypeScript – Used for Rocket.Chat app development.

OAuth – Secure authentication and API token management.
