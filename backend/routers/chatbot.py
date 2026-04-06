import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from agent.pipeline import stream_chatbot_response

router = APIRouter(tags=["chatbot"])


def _clean_response(text: str) -> str:
    """Strip hallucinated meta-text that minimax model sometimes prepends."""
    # Remove lines like "We cannot invoke subagent X because it does not exist..."
    text = re.sub(r'^.*?`general-purpose`\s*', '', text, flags=re.DOTALL)
    text = re.sub(r'^We cannot invoke subagent.*?\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'^.*?does not exist.*?\n', '', text, flags=re.MULTILINE)
    return text.strip()


@router.websocket("/ws/chatbot/{parent_id}")
async def websocket_chatbot(websocket: WebSocket, parent_id: str, token: str = ""):
    """
    Chatbot WebSocket — auth is optional for demo/dev.
    In production: uncomment the auth block below.
    """
    # ── Optional auth (uncomment for production) ──────────────────────────────
    # from auth import verify_ws_token
    # if not verify_ws_token(token):
    #     await websocket.close(code=4001)
    #     return
    # ─────────────────────────────────────────────────────────────────────────

    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") != "message":
                continue

            user_message = data.get("content", "").strip()
            if not user_message:
                continue

            brief_id = data.get("brief_id")
            feature  = data.get("feature", "homework")

            full_response = ""
            try:
                async for token_text in stream_chatbot_response(user_message, brief_id, feature):
                    full_response += token_text
                # Clean before sending to remove hallucinated meta-text
                full_response = _clean_response(full_response)
                await websocket.send_json({"type": "token", "token": full_response})
                await websocket.send_json({"type": "done", "full_content": full_response})
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass
