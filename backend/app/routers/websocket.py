import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.auth import decode_token
from app.database import supabase

router = APIRouter()


class RoomManager:
    def __init__(self):
        self.rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, session_id: str, user_id: str, ws: WebSocket):
        await ws.accept()
        if session_id not in self.rooms:
            self.rooms[session_id] = {}
        self.rooms[session_id][user_id] = ws

    def disconnect(self, session_id: str, user_id: str):
        if session_id in self.rooms:
            self.rooms[session_id].pop(user_id, None)
            if not self.rooms[session_id]:
                del self.rooms[session_id]

    async def broadcast(self, session_id: str, sender_id: str, message: str):
        room = self.rooms.get(session_id, {})
        stale = []
        for uid, ws in room.items():
            if uid != sender_id:
                try:
                    await ws.send_text(message)
                except Exception:
                    stale.append(uid)
        for uid in stale:
            self.disconnect(session_id, uid)

    async def broadcast_all(self, session_id: str, message: str):
        room = self.rooms.get(session_id, {})
        stale = []
        for uid, ws in room.items():
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(uid)
        for uid in stale:
            self.disconnect(session_id, uid)


manager = RoomManager()


def _verify_participant(session_id: str, user_id: str) -> bool:
    result = (
        supabase.table("sessions")
        .select("student_id, tutor_id")
        .eq("id", session_id)
        .execute()
    )
    if not result.data:
        return False
    row = result.data[0]
    return user_id in (row["student_id"], row["tutor_id"])


@router.websocket("/ws/session/{session_id}")
async def session_websocket(websocket: WebSocket, session_id: str, token: str = ""):
    user = decode_token(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = user["user_id"]

    if not _verify_participant(session_id, user_id):
        await websocket.close(code=4003, reason="Not a participant")
        return

    await manager.connect(session_id, user_id, websocket)

    join_msg = json.dumps({
        "type": "user:joined",
        "data": {"user_id": user_id, "role": user["role"], "email": user["email"]},
    })
    await manager.broadcast(session_id, user_id, join_msg)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                await manager.broadcast(session_id, user_id, raw)
            except Exception as e:
                print(f"WS broadcast error: {e}")
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS unexpected error: {e}")
    finally:
        manager.disconnect(session_id, user_id)
        leave_msg = json.dumps({
            "type": "user:left",
            "data": {"user_id": user_id, "role": user["role"]},
        })
        await manager.broadcast_all(session_id, leave_msg)
