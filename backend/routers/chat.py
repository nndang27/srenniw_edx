from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import verify_ws_token
from db.supabase import get_supabase

router = APIRouter(tags=["chat"])

# In-memory room connections: { room_id: [websocket, ...] }
rooms: dict[str, list[WebSocket]] = {}

@router.websocket("/ws/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str, token: str):
    # Verify token
    payload = verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    await websocket.accept()
    sender_id = payload["sub"]
    sender_role = payload.get("role", "unknown")

    # Send message history on connect
    db = get_supabase()
    history = db.table("chat_messages").select("*")\
        .eq("room_id", room_id).order("created_at").limit(30).execute()
    await websocket.send_json({"type": "history", "messages": history.data})

    # Join room
    rooms.setdefault(room_id, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "typing":
                for ws in rooms.get(room_id, []):
                    if ws != websocket:
                        await ws.send_json({"type": "typing", "sender_id": sender_id})
            elif data.get("type") == "message":
                # Save to DB
                row = db.table("chat_messages").insert({
                    "room_id": room_id,
                    "sender_id": sender_id,
                    "sender_role": sender_role,
                    "content": data["content"]
                }).execute()
                msg = row.data[0]
                # Broadcast to all in room
                for ws in rooms.get(room_id, []):
                    await ws.send_json({"type": "message", **msg})
    except WebSocketDisconnect:
        rooms[room_id] = [ws for ws in rooms[room_id] if ws != websocket]
