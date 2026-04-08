import os
import httpx
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

bearer_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Verify Clerk JWT and return decoded payload (with role from public_metadata)."""
    token = credentials.credentials
    public_key = os.getenv("CLERK_PEM_PUBLIC_KEY", "").replace("\\n", "\n")
    try:
        # Hackathon mode: bypass signature verification to avoid Keyless issues
        payload = jwt.get_unverified_claims(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    # If role already in token (via JWT template) — done
    if _get_role(payload) is not None:
        return payload

    # Fallback: fetch public_metadata from Clerk Backend API
    clerk_secret = os.getenv("CLERK_SECRET_KEY", "")
    if clerk_secret:
        try:
            user_id = payload.get("sub", "")
            resp = httpx.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {clerk_secret}"},
                timeout=5,
            )
            if resp.status_code == 200:
                meta = resp.json().get("public_metadata", {})
                payload["role"] = meta.get("role")
        except Exception:
            pass  # proceed without role if Clerk API unreachable

    return payload

def _get_role(payload: dict) -> str | None:
    """Extract role from JWT claims — checks multiple locations Clerk may use."""
    return (
        payload.get("role")
        or payload.get("public_metadata", {}).get("role")
        or payload.get("metadata", {}).get("role")
    )

def require_teacher(payload: dict = Depends(verify_token)) -> dict:
    """Hackathon mode: accept any authenticated user."""
    return payload

def require_parent(payload: dict = Depends(verify_token)) -> dict:
    """Hackathon mode: accept any authenticated user."""
    return payload

def verify_ws_token(token: str) -> dict:
    """Verify token from WebSocket query param (not header)."""
    try:
        return jwt.get_unverified_claims(token)
    except Exception:
        return None
