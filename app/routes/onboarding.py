from fastapi import APIRouter
from pydantic import BaseModel
from app.database import save_shop

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingData(BaseModel):
    user_id: str
    mode: str
    budget: int
    prix: float = None
    secteur: str
    tracking: bool


@router.post("/save")
def save_onboarding(data: OnboardingData):
    save_shop(
        user_id=data.user_id,
        mode=data.mode,
        budget=data.budget,
        prix=data.prix,
        secteur=data.secteur,
        tracking=data.tracking,
    )
    return {"status": "saved", "user_id": data.user_id}
