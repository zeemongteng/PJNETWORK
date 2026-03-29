# GBNL — Global Federal Network Line

**CP352005 Networks · Undergraduate Computer Networks Project**

A full-stack interactive simulation of a decentralized, mesh-based military communication network. Built with Python FastAPI and Next.js 19.

---

## Team

| Role | Name |
|------|------|
| Architect | ปริญญ์นกร อยู่แท้กูล |
| Engineer | ชนิณทร์ ใจช่วง |
| Security Specialist | ปุณยวีร์ แทนคำ |
| DevOps | พงศพัศ เลบ้านแท่น |
| Tester/QA | เมธัส มณีวิจิตร |

---

## Architecture

GBNL is structured as a 4-layer system, each layer implemented as a live interactive module:

| Layer | Name | Description |
|-------|------|-------------|
| 1 | **Active Skin** | Biometric authentication (pulse / stress / temperature / iris). Issues clearance-level sessions. Bio-Kill Switch auto-triggers on KIA or capture. |
| 2 | **Ghost Web** | 21-node decentralized mesh network (satellites, drones, relays, ground units). Frequency hopping across 8 bands. BFS connectivity tracking. |
| 3 | **Void Protocol** | Message fragmentation into SHA-256 hashed shards sent via separate mesh paths. An intercepted shard is meaningless without all others. |
| 4 | **The Sentinel** | AI threat detection monitoring all nodes. Generates alerts based on network health. Drives tactical haptic feedback signals to soldier armor. |

Layers are wired together — a Ghost Web attack severs shard routes in Void Protocol, escalates Sentinel threat level, and triggers auto-recovery when the mesh is restored.

---

## Project Structure

```
PJNETWORK/
├── backend/
│   ├── main.py           # FastAPI app — all 4 layers, 17 endpoints
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── app/
│   │   ├── page.tsx      # Root page — tabs, cross-layer state, event callbacks
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ghost-web.tsx      # Layer 2: mesh SVG visualization + controls
│   │   ├── active-skin.tsx    # Layer 1: biometric sliders + session management
│   │   ├── sentinel.tsx       # Layer 4: threat timeline + haptic simulator
│   │   ├── shard-card.tsx     # Layer 3: shard grid visualization
│   │   ├── protocol-log.tsx   # System-wide event log
│   │   └── stat-card.tsx      # Overview stat cards
│   ├── lib/
│   │   └── api.ts        # Type-safe API client with error parsing
│   └── package.json
├── vercel.json           # Deployment config
├── architecture_spec.md  # Full architectural specification
├── implementation_plan.md# 4-week sprint plan and test results
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
fastapi dev main.py
# Runs on http://localhost:8000
```

API docs available at `http://localhost:8000/docs`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

The frontend proxies `/api/*` to the backend automatically in development.

---

## API Overview

| Namespace | Endpoints | Description |
|-----------|-----------|-------------|
| `/network/*` | 4 | Mesh topology, attack simulation, reset, frequency hop |
| `/auth/*` | 3 | Biometric verify, kill switch, session list |
| `/sentinel/*` | 4 | Threat status, scan, resolve alert, clear |
| `/shard` `/reassemble` `/corrupt` `/recover` | 4 | Void Protocol operations |
| `/health` `/info` | 2 | System status |

---

## Simulation Walkthrough

1. **Authenticate** — Go to Active Skin, adjust sliders to normal readings, click Verify Biometrics. Void Protocol unlocks.
2. **Shard a message** — Go to Void Protocol, enter a message, click Shard & Transmit. Watch fragments appear in the grid.
3. **Simulate an attack** — Go to Ghost Web, set attack slider to 50%+, click Destroy. Watch shard paths get severed in the log.
4. **Try recovery** — In Void Protocol, click Attempt Recovery to reconstruct from surviving shards.
5. **Restore the mesh** — Back in Ghost Web, click Restore Full Mesh. Auto-recovery fires and reassembles the message.
6. **Trigger the kill switch** — In Active Skin, click Kill Switch on an active session. Watch the Sentinel generate a CRITICAL alert.
7. **Run a threat scan** — In Sentinel, click Run Threat Scan. Alerts appear with haptic feedback signals.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Python + FastAPI | 3.12 / 0.128 |
| Data Validation | Pydantic | v2 |
| Frontend | Next.js + React | 16.1.6 / 19.2.4 |
| Language | TypeScript | 5.7.3 |
| Styling | Tailwind CSS | 4.2.0 |
| Components | Radix UI + shadcn/ui | — |
| Deployment | Vercel | — |

---

## Documentation

- [architecture_spec.md](architecture_spec.md) — Layer-by-layer architectural review, API tables, security model, cross-layer event model
- [implementation_plan.md](implementation_plan.md) — 4-week sprint plan, testing strategy, resilience test results
