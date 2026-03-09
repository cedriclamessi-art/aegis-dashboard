from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import COMPOSIO_API_KEY, TOOLKIT_MAP

router = APIRouter(prefix="/api/connect", tags=["connect"])


def get_composio():
    if not COMPOSIO_API_KEY:
        raise HTTPException(status_code=500, detail="COMPOSIO_API_KEY manquante.")
    try:
        from composio import Composio
        return Composio(api_key=COMPOSIO_API_KEY)
    except ImportError:
        raise HTTPException(status_code=500, detail="composio-core non installé.")


class ConnectRequest(BaseModel):
    user_id: str
    platform: str


@router.post("/init")
def init_connection(body: ConnectRequest):
    toolkit = TOOLKIT_MAP.get(body.platform.lower())
    if not toolkit:
        raise HTTPException(status_code=400, detail=f"Plateforme inconnue : {body.platform}")
    composio = get_composio()
    try:
        connection = composio.connected_accounts.initiate(
            user_id=body.user_id, toolkit=toolkit,
        )
        url = getattr(connection, "redirect_url", None) or getattr(connection, "url", "")
        if not url:
            raise HTTPException(status_code=500, detail="Composio n'a pas retourné d'URL")
        return {"url": url, "platform": body.platform, "toolkit": toolkit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{user_id}")
def connection_status(user_id: str):
    composio = get_composio()
    try:
        accounts = composio.connected_accounts.list(user_id=user_id)
        connected = {a.appUniqueId.upper() for a in (accounts or [])}
        return {
            platform: toolkit in connected
            for platform, toolkit in TOOLKIT_MAP.items()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
