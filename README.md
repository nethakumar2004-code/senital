# Sentinel 🛡️
**Real-Time AI Infrastructure Monitoring System**

Sentinel is a full-stack observability platform that ingests real-time server logs, detects anomalies, and uses Generative AI to perform Root Cause Analysis (RCA) automatically.

## 🚀 Features
- **Event-Driven Architecture:** Uses Apache Kafka to handle high-throughput log streams.
- **Real-Time Visualization:** WebSocket-based dashboard built with Next.js & Recharts.
- **AI-Powered Diagnostics:** Automatically analyzes error bursts and suggests code fixes.
- **Containerized:** Fully Dockerized infrastructure.

## 🛠️ Tech Stack
- **Backend:** FastAPI (Python), AIOKafka
- **Frontend:** Next.js, Tailwind CSS, Recharts
- **Data Streaming:** Apache Kafka, Zookeeper
- **AI Engine:** Google Gemini (Generative AI)
- **DevOps:** Docker Compose

## ⚡ How to Run
1. **Start Infrastructure:** `docker-compose up -d`
2. **Start Backend:** `python -m uvicorn main:app --reload`
3. **Start Frontend:** `npm run dev`
4. **Simulate Traffic:** `python producer.py`
