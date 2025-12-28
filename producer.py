import time
import json
import random
from kafka import KafkaProducer

# Wait for Kafka to start
time.sleep(5)

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

print("Producer connected! Simulating complex server traffic...")

# Realistic Error Scenarios
ERROR_SCENARIOS = [
    {"msg": "ConnectionRefusedError: PostgreSQL on 5432 failed", "service": "database-shard-01"},
    {"msg": "OutOfMemoryError: Java heap space", "service": "payment-processor"},
    {"msg": "403 Forbidden: API Key expired for Gateway", "service": "auth-service"}
]

while True:
    # 85% chance of success (Normal traffic)
    if random.random() < 0.85:
        status = "200"
        log = {
            "timestamp": time.time(),
            "service": "api-gateway",
            "status": "200",
            "message": "GET /api/v1/transactions - Success (12ms)"
        }
    else:
        # 15% chance of a CRITICAL error
        status = "500"
        scenario = random.choice(ERROR_SCENARIOS)
        log = {
            "timestamp": time.time(),
            "service": scenario["service"],
            "status": "500",
            "message": scenario["msg"]
        }
    
    producer.send('server-logs', log)
    print(f"Generated: {status} - {log['message'][:30]}...")
    
    # Randomize speed to look like real traffic
    time.sleep(random.uniform(0.5, 1.5))