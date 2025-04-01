from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from huggingface_hub import create_pull_request, create_discussion

router = APIRouter()



class PullRequestData(BaseModel):
    repo_id: str
    title: str
    token: str

@router.post("/pull_request")
async def post_pull_request(data: PullRequestData):
    try:
        # Create a pull request using the data received from the request body
        pr = create_pull_request(
            repo_id=data.repo_id,
            title=data.title,
            token=data.token,
        )

        # Return the PR details
        return {"message": "Pull request created successfully", "repo_id": data.repo_id, "title": data.title}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DiscussionCreateRequest(BaseModel):
    repo_id: str
    title: str
    token: str  #  Accept token directly from Rocket.Chat request

@router.post("/create-discussion")
async def create_new_discussion(request: DiscussionCreateRequest):
    """ Create a new discussion on Hugging Face """
    try:
        discussion = create_discussion(
            repo_id=request.repo_id,
            title=request.title,
            token=request.token  #  Token comes from Rocket.Chat, not session storage
        )

        return {"discussion_num": discussion.num, "title": discussion.title, "status": discussion.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

