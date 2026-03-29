# GBNL Network Architecture Specification v1.0
**Architectural Review Document – CP352005 Networks**

Project: Global Federal Network Line (GBNL)
Course: Undergraduate Computer Networks

---

## Document Control

| Version | Date       | Author                  | Role      | Changes                          |
|---------|------------|-------------------------|-----------|----------------------------------|
| v1.0    | 20/02/2026 | ปริญญ์นกร อยู่แท้กูล | Architect | Initial architectural specification |

---

## Team Roles

| Role                    | Name                    | Responsibilities                                              |
|-------------------------|-------------------------|---------------------------------------------------------------|
| **Architect**           | ปริญญ์นกร อยู่แท้กูล | System design, layered architecture, interface contracts      |
| **Engineer**            | ชนิณทร์ ใจช่วง        | Protocol design, routing simulation, mesh implementation      |
| **Security Specialist** | ปุณยวีร์ แทนคำ        | Encryption, zero-trust model, threat modeling                 |
| **DevOps**              | พงศพัศ เลบ้านแท่น    | Simulation environment, CI/CD, integration                    |
| **Tester/QA**           | เมธัส มณีวิจิตร       | Test planning, fault injection, resilience validation         |

---

# Part 1: Executive Summary

## 1.1 Project Vision

GBNL (Global Federal Network Line) is a decentralized, mesh-based, quantum-inspired military communication architecture designed to eliminate single points of failure, resist interception, and enhance battlefield survivability.

The system is implemented as a full-stack interactive simulation:

- **Backend:** Python 3.12 + FastAPI 0.128 REST API
- **Frontend:** Next.js 16 + React 19 + TypeScript 5.7 dashboard
- **Deployment:** Vercel (frontend + serverless Python functions)

The project demonstrates understanding of:

- Decentralized mesh network architecture
- Secure data fragmentation and multi-path routing
- Zero-trust biometric authentication
- AI-driven threat detection and haptic feedback
- Simulation-based resilience validation
- Cross-layer system integration

---

## 1.2 Educational Objectives

- Apply OSI layered principles to a multi-layer network stack
- Design and simulate adaptive mesh routing with BFS connectivity analysis
- Model zero-trust authentication with biometric scoring
- Implement secure data fragmentation (Void Protocol sharding)
- Analyze network resilience under node failure (up to 80% destruction tested)
- Demonstrate cross-layer event propagation (network damage → shard loss → recovery)

---

## 1.3 Scope and Constraints

| Aspect        | In Scope                                     | Out of Scope                  |
|---------------|----------------------------------------------|-------------------------------|
| Architecture  | 4-layer network stack with REST API          | Real quantum hardware         |
| Simulation    | Python FastAPI mesh simulation (21 nodes)    | Satellite launch systems      |
| Encryption    | SHA-256 shard hashing, simulated QKD bands   | Real QKD hardware             |
| Authentication| Biometric scoring model (pulse/stress/temp)  | Real iris/DNA scanning        |
| Testing       | Node failure simulation, shard corruption    | Military deployment           |
| Frontend      | React 19 interactive dashboard               | Mobile native apps            |

---

# Part 2: Architectural Overview

## 2.1 GBNL Layered Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Application Layer  │  Tactical Command Interface (React UI) │
├──────────────────────────────────────────────────────────────┤
│  Feedback Layer     │  The Sentinel — AI Threat Detection    │
│                     │  + Tactical Haptic Feedback System     │
├──────────────────────────────────────────────────────────────┤
│  Protocol Layer     │  Void Protocol — Data Sharding         │
│                     │  SHA-256 shard hashing, multi-path tx  │
├──────────────────────────────────────────────────────────────┤
│  Security Layer     │  Active Skin Interface                 │
│                     │  Biometric Auth & Bio-Kill Switch      │
├──────────────────────────────────────────────────────────────┤
│  Network Layer      │  Ghost Web — Adaptive Mesh Routing     │
│                     │  BFS connectivity, frequency hopping   │
├──────────────────────────────────────────────────────────────┤
│  Physical Layer     │  Ghost Web Nodes (Simulated)           │
│                     │  21 nodes: 1 CC + 7 SAT + 4 Relay      │
│                     │  + 6 Drone + 3 Ground Unit             │
└──────────────────────────────────────────────────────────────┘
```

---

## 2.2 Cross-Layer Event Model

A key architectural feature of GBNL is that layers are not isolated — events in one layer propagate upward and trigger responses in dependent layers:

```
Ghost Web Attack
      │
      ▼
Connectivity drops below 80%
      │
      ├──▶  Sentinel: threat level escalates (LOW → HIGH → CRITICAL)
      │
      └──▶  Void Protocol: shard paths severed
                  │
                  ├──▶  <80%  connectivity: 15% of active shards lost
                  ├──▶  <50%  connectivity: 40% of active shards lost
                  └──▶  <25%  connectivity: 70% of active shards lost

Ghost Web Reset (connectivity ≥ 90%)
      │
      └──▶  Void Protocol: auto-recovery triggered via /recover endpoint
                  │
                  ├──▶  Success: shards marked delivered, message reassembled
                  └──▶  Partial: issues logged, manual recovery available

Active Skin Kill Switch
      │
      └──▶  Sentinel: CRITICAL compromise alert generated
                  │
                  └──▶  Void Protocol: transmission lock engaged
```

---

# Part 3: Layer-by-Layer Architectural Review

---

## 3.1 Physical / Network Layer – Ghost Web

**Design Review Status: ✅ Implemented**

### Overview

Ghost Web is a decentralized 21-node mesh network simulating a military-grade communication backbone. It uses Breadth-First Search (BFS) from the command center to calculate real-time connectivity percentage, and supports simulated frequency hopping across 8 distinct bands.

### Node Topology

| Node Type       | Count | Role                                        | Colour  |
|-----------------|-------|---------------------------------------------|---------|
| Command Center  | 1     | Central hub (CMD-ALPHA) — never destroyed   | Cyan    |
| Micro-Satellite | 7     | Orbital ring (SAT-01 to SAT-07)             | Violet  |
| Relay Station   | 4     | Inner ring (RELAY-N/E/S/W)                  | Emerald |
| Drone           | 6     | Outer positions (DRONE-01 to DRONE-06)      | Amber   |
| Ground Unit     | 3     | Surface units (UNIT-01 to UNIT-03)          | Red     |
| **Total**       | **21**| —                                           | —       |

### Frequency Bands (Hopping Pool)

| Band           | Type                   |
|----------------|------------------------|
| 1.2 GHz        | UHF Military           |
| 2.4 GHz        | ISM Standard           |
| 5.8 GHz        | ISM High-Speed         |
| 24 GHz         | Millimetre Wave        |
| 60 GHz         | Short-Range mmWave     |
| Quantum-QKD    | Quantum Key Exchange   |
| Terahertz-T1   | THz Experimental       |
| Optical-IR     | Infrared Optical       |

### Mesh Status Thresholds

| Connectivity % | Status Label                    |
|----------------|---------------------------------|
| ≥ 99%          | OPTIMAL — FULL MESH INTEGRITY   |
| ≥ 80%          | DEGRADED — MESH SELF-HEALING    |
| ≥ 50%          | CRITICAL — PARTIAL MESH ACTIVE  |
| < 50%          | BREACH — MESH FRAGMENTED        |

### API Endpoints

| Method | Endpoint           | Description                                          |
|--------|--------------------|------------------------------------------------------|
| GET    | `/network/topology`| Return full node list, edges, and connectivity stats |
| POST   | `/network/attack`  | Destroy `percentage` (1–100%) of non-CC nodes        |
| POST   | `/network/reset`   | Restore all nodes to full health (health = 100)      |
| POST   | `/network/hop`     | Rotate all active nodes to a new frequency band      |

### Connectivity Algorithm

```python
def calculate_connectivity() -> float:
    """BFS from CMD-ALPHA; return % of active nodes reachable."""
    active = {k for k, v in nodes.items() if v.status != DESTROYED}
    visited = set()
    queue = ["cc-alpha"]
    while queue:
        nid = queue.pop(0)
        if nid in visited: continue
        visited.add(nid)
        for conn in nodes[nid].connections:
            if conn in active and conn not in visited:
                queue.append(conn)
    return len(visited) / len(active) * 100
```

---

## 3.2 Security Layer – Active Skin Interface

**Design Review Status: ✅ Implemented**

### Overview

Active Skin is a zero-trust biometric authentication layer that issues clearance-level sessions. It includes a Bio-Kill Switch that automatically wipes session data and marks hardware for self-destruction when physiological thresholds are exceeded.

### Biometric Scoring Model

| Reading       | Normal Range  | Penalty Conditions                                |
|---------------|---------------|---------------------------------------------------|
| Pulse (BPM)   | 45–200        | < 45 BPM: −0.6 score (KIA), > 150 BPM: −0.2      |
| Stress Level  | 0.0–1.0       | > 0.92: −0.3 (kill switch pre-armed), > 0.80: −0.1|
| Temperature   | 34.0–41.0 °C  | Outside range: −0.5 (exposure/injury)             |
| Iris Hash     | SHA-256 (64 hex chars) | Invalid format: −0.5 (tampered)          |

Authentication requires **score ≥ 0.5**. Clearance level is derived from score:

| Score      | Clearance Level |
|------------|-----------------|
| > 0.90     | CL-5 (Top Secret) |
| > 0.75     | CL-4 |
| ≥ 0.50     | CL-3 |
| < 0.50     | Denied |

### Bio-Kill Switch

When triggered (manually or automatically via score < 0.5), the kill switch:
1. Sets session `status = "killed"`
2. Generates a CRITICAL Sentinel alert
3. Emits `HapticPattern.EMERGENCY` signal
4. Returns `data_wiped: true`, `hardware_destroyed: true`

### API Endpoints

| Method | Endpoint           | Description                                    |
|--------|--------------------|------------------------------------------------|
| POST   | `/auth/verify`     | Score biometric reading and issue session      |
| POST   | `/auth/killswitch` | Trigger Bio-Kill Switch for a session          |
| GET    | `/auth/sessions`   | List all sessions with active/killed counts    |

---

## 3.3 Protocol Layer – Void Protocol

**Design Review Status: ✅ Implemented**

### Overview

Void Protocol fragments messages into fixed-size shards (default 8 characters), assigns each shard a SHA-256 hash for integrity verification, and routes each fragment via separate Ghost Web paths. An intercepted shard is meaningless without all other fragments.

### Shard Structure

```json
{
  "message_id": "uuid-v4",
  "index": 0,
  "total": 14,
  "payload": "GBNL SEC",
  "hash": "a3f1c9e2b7d84051",
  "status": "transit | delivered | lost | corrupted",
  "active": true
}
```

### Shard Operations

| Operation              | Description                                                          |
|------------------------|----------------------------------------------------------------------|
| **Shard**              | Split message into ceil(len/shard_size) fragments, hash each         |
| **Reassemble**         | Sort by index, verify all hashes, concatenate payloads               |
| **Corrupt (unsorted)** | Shuffle shard order — simulates out-of-order delivery                |
| **Corrupt (incomplete)**| Drop random shards — simulates packet loss                          |
| **Recover**            | Sort available shards, skip hash mismatches, reconstruct partial msg |
| **Intercept**          | Mark one random active shard as `lost` (frontend simulation)         |

### Input Validation

| Parameter   | Constraint              | Error Response    |
|-------------|-------------------------|-------------------|
| `data`      | Non-empty string        | HTTP 400          |
| `shard_size`| Integer 1–64            | HTTP 422 (Pydantic)|
| `corruption_type` | `unsorted` or `incomplete` | HTTP 400 |

### API Endpoints

| Method | Endpoint      | Description                                           |
|--------|---------------|-------------------------------------------------------|
| POST   | `/shard`      | Fragment data into shards (shard_size: 1–64)          |
| POST   | `/reassemble` | Reconstruct original message from sorted shards       |
| POST   | `/corrupt`    | Apply unsorted or incomplete corruption simulation    |
| POST   | `/recover`    | Attempt recovery ignoring hash errors and gaps        |

---

## 3.4 Feedback Layer – The Sentinel

**Design Review Status: ✅ Implemented**

### Overview

The Sentinel is an AI threat detection layer that monitors all active nodes, generates alerts based on network health, and emits tactical haptic feedback signals to soldier armor systems.

### Threat Types

| Threat Type        | Label      | Haptic Response  |
|--------------------|------------|------------------|
| signal_jamming     | JAMMING    | ALERT_PULSE      |
| data_interception  | INTERCEPT  | FREEZE           |
| physical_attack    | KINETIC    | DODGE_LEFT       |
| cyber_intrusion    | CYBER      | ALERT_PULSE      |
| unit_compromise    | COMPROMISE | EMERGENCY        |

### Threat Level Derivation

| Nodes Destroyed | Threat Level |
|-----------------|--------------|
| 0%              | NONE         |
| < 15%           | LOW          |
| < 30%           | MEDIUM       |
| < 50%           | HIGH         |
| ≥ 50%           | CRITICAL     |

### Alert Generation Probability

| Network Threat Level | Base Chance per Scan |
|----------------------|----------------------|
| NONE                 | 15%                  |
| LOW                  | 30%                  |
| MEDIUM               | 55%                  |
| HIGH                 | 75%                  |
| CRITICAL             | 95%                  |

### API Endpoints

| Method | Endpoint                      | Description                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/sentinel/status`            | Get current threat level and alert list  |
| POST   | `/sentinel/scan`              | Run AI scan, generate new threat alerts  |
| POST   | `/sentinel/resolve/{alert_id}`| Mark a specific alert as resolved        |
| POST   | `/sentinel/clear`             | Clear all alerts                         |

---

## 3.5 Application Layer – Tactical Command Interface

**Design Review Status: ✅ Implemented**

### Overview

The Tactical Command Interface is a real-time React 19 dashboard served via Next.js 16. It presents all four layers through a tabbed interface with an Overview tab showing live cross-layer status.

### Technology Stack

| Component         | Technology              | Version  |
|-------------------|-------------------------|----------|
| Framework         | Next.js (App Router)    | 16.1.6   |
| UI Library        | React                   | 19.2.4   |
| Type System       | TypeScript              | 5.7.3    |
| Styling           | Tailwind CSS            | 4.2.0    |
| Component Library | Radix UI + shadcn/ui    | —        |
| Icons             | Lucide React            | 0.564.0  |
| Data Fetching     | Native fetch + SWR      | 2.2.5    |

### Frontend Modules

| File                          | Purpose                                               |
|-------------------------------|-------------------------------------------------------|
| `app/page.tsx`                | Root page: layout, cross-layer state, event callbacks |
| `components/ghost-web.tsx`    | Layer 2: mesh visualization, attack/reset/hop controls|
| `components/active-skin.tsx`  | Layer 1: biometric sliders, session management        |
| `components/sentinel.tsx`     | Layer 4: threat timeline, haptic simulator            |
| `components/shard-card.tsx`   | Layer 3: shard grid visualization                     |
| `components/protocol-log.tsx` | System-wide event log                                 |
| `components/stat-card.tsx`    | Overview stat grid                                    |
| `lib/api.ts`                  | Type-safe API client with `ApiError` error parsing    |

---

# Part 4: Backend Architecture

## 4.1 FastAPI Application Structure

```
backend/main.py  (≈ 965 lines)
│
├── Middleware
│   ├── CORSMiddleware (allow all origins)
│   └── StripApiPrefixMiddleware (Vercel /api prefix removal)
│
├── Enums: NodeType, NodeStatus, ThreatType, ThreatLevel, HapticPattern
│
├── Pydantic Models (23 models)
│   ├── Network: GBNLNode, NetworkTopology, AttackRequest/Response, HopResponse
│   ├── Auth: BiometricReading, AuthSession, AuthResponse, KillSwitchRequest/Response
│   ├── Sentinel: ThreatAlert, SentinelStatus, ScanResponse
│   └── Void: ShardRequest, Shard, ShardResponse, ReassembleRequest/Response,
│              CorruptionRequest/Response, RecoveryRequest/Response
│
├── Global State (in-memory)
│   ├── network_nodes: dict[str, GBNLNode]
│   ├── node_connections: list[tuple[str, str]]
│   ├── auth_sessions: dict[str, AuthSession]
│   └── threat_alerts: list[ThreatAlert]
│
├── Engine Functions
│   ├── init_network() — builds 21-node topology at startup
│   ├── calculate_connectivity() — BFS reachability from CMD-ALPHA
│   ├── mesh_status_label() — derives human-readable status string
│   ├── score_biometrics() — multi-factor biometric scoring
│   ├── generate_threats() — probabilistic alert generation
│   └── VoidProtocol class — shard, reassemble, corrupt, recover
│
└── API Routes (17 endpoints across 5 namespaces)
    ├── /network/*  (4 routes)
    ├── /auth/*     (3 routes)
    ├── /sentinel/* (4 routes)
    ├── /shard, /reassemble, /corrupt, /recover  (4 routes)
    └── /health, /info  (2 routes)
```

## 4.2 Error Handling

| Error Condition               | HTTP Status | Response Body                                    |
|-------------------------------|-------------|--------------------------------------------------|
| Empty shard data              | 400         | `{"detail": "Data cannot be empty"}`             |
| shard_size out of range (1–64)| 422         | Pydantic validation error with field path        |
| attack percentage out of range| 422         | Pydantic validation error with field path        |
| Unknown corruption type       | 400         | `{"detail": "Unknown corruption type: ..."}`     |
| Session not found (killswitch)| 404         | `{"detail": "Session not found"}`                |
| Alert not found (resolve)     | 404         | `{"detail": "Alert not found"}`                  |

---

# Part 5: Deployment Architecture

## 5.1 Vercel Configuration

```json
{
  "builds": [
    { "src": "frontend/package.json", "use": "@vercel/next" },
    { "src": "backend/main.py",       "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/main.py" },
    { "src": "/(.*)",     "dest": "frontend/$1" }
  ]
}
```

The `StripApiPrefixMiddleware` removes the `/api` prefix added by Vercel's router before routes reach FastAPI, so endpoint paths remain consistent between development (Next.js proxy) and production (Vercel serverless).

## 5.2 Development Environment

| Service  | Command            | Port |
|----------|--------------------|------|
| Frontend | `npm run dev`      | 3000 |
| Backend  | `fastapi dev main.py` | 8000 |

Next.js rewrites `/api/*` → `http://localhost:8000/*` in development via `next.config.ts`.

---

# Part 6: Security Model

## 6.1 Zero-Trust Principles Applied

| Principle               | Implementation                                           |
|-------------------------|----------------------------------------------------------|
| Never trust, always verify | Every Void Protocol transmission requires Active Skin session |
| Least privilege         | Clearance levels CL-3 to CL-5 derived from biometric score |
| Assume breach           | Shard interception yields only a meaningless fragment    |
| Continuous monitoring   | Sentinel polls every 8 seconds, threat level drives alerts |

## 6.2 Void Protocol Security Model

An intercepted shard in isolation is provably useless:

- Each shard carries only `ceil(N / shard_size)` characters of the message
- The shard's `hash` field is a 16-character SHA-256 prefix — useless for decryption
- Reassembly requires all N shards sorted by `index` with hashes verified
- Without `message_id`, `index`, and `total`, even the fragment's position is unknown

---

*Document prepared for CP352005 Networks — GBNL Project v1.0*
