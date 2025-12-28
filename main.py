import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from aiokafka import AIOKafkaConsumer
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# --- MOCKED AI BRAIN ---
# These are the exact kinds of responses Gemini would give.
# We mock them to ensure the demo is smooth and deterministic.
AI_SOLUTIONS = [
    "Root Cause: PostgreSQL connection pool exhausted (Max: 100). Fix: Increase 'max_connections' in postgresql.conf or implement connection pooling with PgBouncer.",
    "Root Cause: Memory leak detected in 'payment-service' heap. Fix: Rollback to stable release v2.4.1 using 'kubectl rollout undo deployment/payment'.",
    "Root Cause: API Gateway Rate Limit (HTTP 429) triggered by external IP. Fix: Adjust Redis rate-limiting rules to allow higher burst traffic for premium users.",
    "Root Cause: DNS resolution timeout for internal microservice. Fix: Restart CoreDNS pods in the 'kube-system' namespace to flush the cache."
]

error_buffer = []

async def analyze_errors_mock(errors):
    """Simulates an AI analysis for the demo."""
    print("⚠️ ANOMALY DETECTED! Triggering AI Agent...")
    
    # 1. Simulate "Thinking" Latency (Network Call)
    await asyncio.sleep(2.0) 
    
    # 2. Return a realistic fix
    return random.choice(AI_SOLUTIONS)

# --- KAFKA CONSUMER ---
async def consume_kafka_and_broadcast():
    global error_buffer
    consumer = AIOKafkaConsumer('server-logs', bootstrap_servers='localhost:9092')
    
    while True:
        try:
            await consumer.start()
            print("Kafka Connected!")
            break
        except:
            await asyncio.sleep(2)

    try:
        async for msg in consumer:
            log_data = json.loads(msg.value.decode('utf-8'))
            
            # Send live logs to dashboard
            await manager.broadcast(json.dumps({"type": "LOG", "data": log_data}))

            # Check for crashes (Status 500)
            if log_data['status'] == "500":
                error_buffer.append(log_data)
                
                # If 3 errors happen, call the Mock AI
                if len(error_buffer) >= 3:
                    analysis = await analyze_errors_mock(error_buffer)
                    
                    # Send the Red Alert
                    await manager.broadcast(json.dumps({"type": "ALERT", "data": analysis}))
                    
                    error_buffer = [] 
    finally:
        await consumer.stop()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consume_kafka_and_broadcast())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)