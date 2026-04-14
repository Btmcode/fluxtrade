import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn
from aggregator import aggregator
from notifications import notification_manager
from portfolio_manager import get_portfolio_manager

app = FastAPI(title="FluxTrade Aggregator API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    # Start the aggregator in the background
    asyncio.create_task(aggregator.run())
    # Start the broadcast loop
    asyncio.create_task(broadcast_stats())
    
    # Set the trade callback for alerts
    aggregator.on_trade_callback = lambda trade: notification_manager.evaluate_trade(trade, manager.broadcast)

async def broadcast_stats():
    while True:
        stats = aggregator.get_stats()
        await manager.broadcast(json.dumps({
            "type": "MARKET_UPDATE",
            "data": stats,
            "timestamp": asyncio.get_event_loop().time()
        }))
        # Periodically check for momentum alerts
        await aggregator._evaluate_market_signals(manager.broadcast)
        await asyncio.sleep(1.0) # 1Hz update rate for terminal
@app.get("/health")
async def health_check():
    return {"status": "fluid", "connections": len(manager.active_connections)}

@app.get("/api/portfolio")
async def get_portfolio():
    pm = get_portfolio_manager(aggregator)
    return await pm.get_consolidated_balances()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle potential incoming client messages
            data = await websocket.receive_text()
            # We can handle client commands here (e.g., change symbols)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
