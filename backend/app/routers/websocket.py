import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.auth import decode_token
from app.database import supabase

router = APIRouter()


class RoomManager:
    """Manages WebSocket connections per session room.

    Uses (user_id, ws) identity so that a reconnecting user doesn't clobber
    their own previous socket — each socket is tracked independently via its
    object id, preventing the old-socket-teardown-removes-new-socket race.
    """

    def __init__(self):
        self.rooms: dict[str, dict[int, tuple[str, WebSocket]]] = {}

    async def connect(self, session_id: str, user_id: str, ws: WebSocket):
        await ws.accept()
        if session_id not in self.rooms:
            self.rooms[session_id] = {}
        old_ids = [
            wid for wid, (uid, _) in self.rooms[session_id].items()
            if uid == user_id
        ]
        for wid in old_ids:
            _, old_ws = self.rooms[session_id].pop(wid)
            try:
                await old_ws.close(code=4000, reason="Replaced by new connection")
            except Exception:
                pass
        self.rooms[session_id][id(ws)] = (user_id, ws)

    def disconnect(self, session_id: str, ws: WebSocket):
        room = self.rooms.get(session_id)
        if not room:
            return
        room.pop(id(ws), None)
        if not room:
            del self.rooms[session_id]

    async def broadcast(self, session_id: str, sender_ws: WebSocket, message: str):
        room = self.rooms.get(session_id, {})
        stale = []
        for wid, (uid, ws) in room.items():
            if ws is not sender_ws:
                try:
                    await ws.send_text(message)
                except Exception:
                    stale.append(wid)
        for wid in stale:
            room.pop(wid, None)

    async def broadcast_all(self, session_id: str, message: str):
        room = self.rooms.get(session_id, {})
        stale = []
        for wid, (uid, ws) in room.items():
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(wid)
        for wid in stale:
            room.pop(wid, None)


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
    await manager.broadcast(session_id, websocket, join_msg)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                await manager.broadcast(session_id, websocket, raw)
            except Exception as e:
                print(f"WS broadcast error: {e}")
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS unexpected error: {e}")
    finally:
        manager.disconnect(session_id, websocket)
        leave_msg = json.dumps({
            "type": "user:left",
            "data": {"user_id": user_id, "role": user["role"]},
        })
        await manager.broadcast_all(session_id, leave_msg)
