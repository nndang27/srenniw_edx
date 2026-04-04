from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import verify_ws_token
from agent.pipeline import stream_chatbot_response

router = APIRouter(tags=["chatbot"])

@router.websocket("/ws/chatbot/{parent_id}")
async def websocket_chatbot(websocket: WebSocket, parent_id: str, token: str):
    payload = verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") != "message":
                continue

            user_message = data["content"]
            brief_id = data.get("brief_id")
            feature = data.get("feature", "summarize")

            full_response = ""
            try:
                # Stream tokens from agent pipeline
                async for token_text in stream_chatbot_response(user_message, brief_id, feature):
                    full_response += token_text
                    await websocket.send_json({"type": "token", "token": token_text})
                await websocket.send_json({"type": "done", "full_content": full_response})
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})
    except WebSocketDisconnect:
        pass


