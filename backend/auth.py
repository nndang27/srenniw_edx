import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

bearer_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Verify Clerk JWT and return decoded payload."""
    token = credentials.credentials
    public_key = os.getenv("CLERK_PEM_PUBLIC_KEY").replace("\\n", "\n")
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def require_teacher(payload: dict = Depends(verify_token)) -> dict:
    """Only allow teacher role."""
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return payload

def require_parent(payload: dict = Depends(verify_token)) -> dict:
    """Only allow parent role."""
    if payload.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Parent access required")
    return payload

def verify_ws_token(token: str) -> dict:
    """Verify token from WebSocket query param (not header)."""
    public_key = os.getenv("CLERK_PEM_PUBLIC_KEY").replace("\\n", "\n")
    try:
        return jwt.decode(token, public_key, algorithms=["RS256"], options={"verify_aud": False})
    except JWTError:
        return None
