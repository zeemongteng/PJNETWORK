# GBNL Implementation Plan v1.0
**4-Week Sprint Plan – CP352005 Networks**

---

## Part 1: Complexity Assessment

| Component                        | Complexity | Risk   | Effort (hrs) | Owner                 |
|----------------------------------|------------|--------|--------------|-----------------------|
| Ghost Web Mesh + BFS Routing     | 5          | High   | 22           | Engineer              |
| Void Protocol (Shard/Reassemble) | 4          | Medium | 14           | Engineer              |
| Active Skin Biometric Auth       | 4          | Medium | 12           | Security Specialist   |
| The Sentinel Threat Engine       | 3          | Medium | 10           | Security Specialist   |
| Cross-Layer Event Integration    | 5          | High   | 16           | Architect             |
| React Dashboard (4 tabs)         | 3          | Low    | 18           | DevOps                |
| Error Simulation & Recovery      | 3          | Medium | 10           | Tester/QA             |
| Vercel Deployment & CI/CD        | 2          | Low    | 6            | DevOps                |
| Documentation                    | 2          | Low    | 8            | All                   |

**Total Estimated:** 116 hours
**Available Team Hours:** 120 hours (5 members × ~24 hrs each)

---

# Part 2: 4-Week Sprint Plan

---

## Week 1 – Architecture & Environment Setup

**Owner:** Architect + DevOps

### Deliverables

- [x] Final architecture specification document
- [x] Repository structure (`/frontend`, `/backend`, `vercel.json`)
- [x] FastAPI project skeleton with CORS and routing middleware
- [x] Next.js 16 project with Tailwind CSS 4 and shadcn/ui
- [x] `/health` and `/info` endpoints operational
- [x] Test plan draft

### Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| FastAPI over Flask | Native Pydantic v2 validation, async support, auto-generated OpenAPI docs |
| Next.js App Router | React Server Components, built-in API proxy rewrites for dev |
| In-memory state | Appropriate for simulation scope; avoids database dependency |
| Vercel deployment | Free tier supports both Next.js and Python serverless functions |
| `StripApiPrefixMiddleware` | Required to normalize Vercel's `/api/*` routing to FastAPI's internal paths |

### Milestone

Backend and frontend boot without errors. `/health` returns `200 OK` from both dev environments.

---

## Week 2 – Core Protocol Implementation

**Owner:** Engineer + Security Specialist

### Tasks

**Ghost Web (Engineer)**
- [x] Define 21-node topology (1 CMD-ALPHA + 7 SAT + 4 RELAY + 6 DRONE + 3 GROUND)
- [x] Implement BFS connectivity calculation from CMD-ALPHA
- [x] `POST /network/attack` — destroy percentage of non-CC nodes
- [x] `POST /network/reset` — restore all nodes to health 100
- [x] `POST /network/hop` — rotate active nodes across 8 frequency bands
- [x] Mesh status labels (OPTIMAL / DEGRADED / CRITICAL / BREACH)

**Void Protocol (Engineer)**
- [x] `VoidProtocol` class with `shard_data()`, `reassemble()`, `attempt_recovery()`
- [x] SHA-256 fragment hashing (16-char prefix per shard)
- [x] `POST /shard` with `shard_size` validation (1–64, Pydantic `Field`)
- [x] `POST /reassemble` — sorted assembly with hash verification
- [x] `POST /corrupt` — unsorted and incomplete corruption modes
- [x] `POST /recover` — partial recovery ignoring hash errors

**Active Skin (Security Specialist)**
- [x] `score_biometrics()` — multi-factor scoring (pulse / stress / temperature / iris hash)
- [x] `POST /auth/verify` — issue session with clearance level CL-3 to CL-5
- [x] `POST /auth/killswitch` — mark session killed, emit CRITICAL Sentinel alert
- [x] `GET /auth/sessions` — return session list with active/killed counts

**The Sentinel (Security Specialist)**
- [x] `generate_threats()` — probabilistic alert generation based on network state
- [x] Haptic pattern mapping (5 threat types → 6 haptic patterns)
- [x] `GET /sentinel/status` — overall threat level from node destruction %
- [x] `POST /sentinel/scan` — generate new alerts
- [x] `POST /sentinel/resolve/{id}` and `POST /sentinel/clear`

### Milestone

Single message sharded, transmitted, and reassembled end-to-end via API.

---

## Week 3 – Frontend, Integration & Resilience Testing

**Owner:** DevOps + Tester/QA + Architect

### Tasks

**React Dashboard (DevOps)**
- [x] `GhostWeb` component — SVG mesh topology (21 nodes, live edges, frequency labels)
- [x] `ActiveSkin` component — biometric sliders, gauge display, session cards, kill confirm dialog
- [x] `Sentinel` component — threat level indicator, alert timeline, haptic simulator
- [x] Void Protocol tab — shard grid, reassembly output, corruption & recovery cards
- [x] Overview tab — 4 live stat cards + mesh status banner + architecture layer grid
- [x] `ProtocolLog` — system-wide event log (last 50 entries)
- [x] `ApiError` class — parses FastAPI `{"detail": ...}` and Pydantic 422 validation arrays

**Cross-Layer Integration (Architect)**
- [x] `handleNetworkChange` — network attack/reset propagates to Void Protocol shard state
- [x] `handleSessionChange` — Active Skin session count locks Void Protocol transmission
- [x] `handleThreatChange` — Sentinel threat level updates Overview in real time
- [x] Shard loss on connectivity drop (15% / 40% / 70% by connectivity band)
- [x] Auto-recovery triggered when connectivity returns to ≥ 90%
- [x] Cross-layer status banner in Void Protocol tab (Active Skin + Ghost Web health)
- [x] Shard & Transmit button disabled when no session or connectivity < 30%

**Error Simulation & Fault Injection (Tester/QA)**
- [x] Error Scenario Tests card — 5 buttons that deliberately trigger backend validation errors
- [x] Intercept Shard — marks one shard `lost` to demonstrate interception uselessness
- [x] Corrupt Unsorted — shuffles shard order, shows reassembly failure
- [x] Corrupt Incomplete — drops shards, shows partial recovery path
- [x] Attempt Recovery — calls `/recover`, handles both full and partial outcomes

### Resilience Tests Conducted

| Scenario | Nodes Destroyed | Connectivity Result | Outcome |
|----------|-----------------|---------------------|---------|
| 30% attack | ~6 nodes | ~75–85% | Mesh self-healing, minor shard disruption |
| 50% attack | ~10 nodes | ~45–60% | Critical — 40% shard loss, high threat alerts |
| 80% attack | ~16 nodes | < 25% | Breach — 70% shard loss, CRITICAL threat level |
| Network reset after 80% | 0 | 100% | Auto-recovery restores all shards, full reassembly |

### Milestone

Self-healing demonstrated: attack → shard loss → reset → auto-recovery → message intact.

---

## Week 4 – Finalization & Presentation

**Owner:** All

### Tasks

- [x] Accessibility fixes (aria-label, title attributes on all input elements)
- [x] TypeScript strict mode — zero `tsc --noEmit` errors
- [x] Error boundary — all catch blocks surface real error messages (not generic "backend error")
- [x] `architecture_spec.md` — this document
- [x] `implementation_plan.md` — this document
- [ ] Performance review — API response times < 200ms for all endpoints
- [ ] Demo scenario preparation (see below)
- [ ] Slide deck creation

### Presentation Structure

| Section              | Presenter             | Duration | Content                                              |
|----------------------|-----------------------|----------|------------------------------------------------------|
| Vision & Context     | Architect             | 2 min    | GBNL goals, OSI mapping, design principles           |
| Architecture Deep Dive| Architect            | 3 min    | Layered diagram, cross-layer event model             |
| Routing Demo         | Engineer              | 4 min    | Ghost Web live: attack, BFS recalculation, reset     |
| Security Model       | Security Specialist   | 3 min    | Active Skin scoring, kill switch, Void shard proof   |
| Live Simulation      | Engineer              | 5 min    | Full attack → shard loss → recovery walkthrough      |
| Testing Results      | Tester/QA             | 2 min    | Fault injection results, error scenario test outputs |
| Conclusion & DevOps  | DevOps                | 1 min    | Deployment architecture, lessons learned             |

---

# Part 3: Testing Strategy

## 3.1 Unit Testing

| Component           | Test Cases                                                        |
|---------------------|-------------------------------------------------------------------|
| `calculate_connectivity` | Full mesh = 100%; isolated nodes excluded; all destroyed = 0% |
| `score_biometrics`  | Normal readings = 1.0; pulse < 45 = fail; invalid iris = fail    |
| `VoidProtocol.shard_data` | `ceil(len/size)` shards; each hash = SHA-256[:16] of payload |
| `VoidProtocol.reassemble` | Correct order; missing shard raises ValueError; tampered hash raises ValueError |
| `VoidProtocol.attempt_recovery` | Partial shards recovered; hash errors logged in issues_found |
| `generate_threats`  | CRITICAL network → ≥ 95% alert probability; NONE network → ≤ 15% |

## 3.2 Integration Testing

| Scenario                          | Steps                                                   | Pass Criteria                                  |
|-----------------------------------|---------------------------------------------------------|------------------------------------------------|
| End-to-end shard transmission     | POST /shard → POST /reassemble                          | Reassembled data === original input            |
| Attack then recover               | POST /network/attack → POST /recover                   | Partial or full data returned, issues logged   |
| Biometric denial (low pulse)      | POST /auth/verify with pulse=40                         | `success: false`, score penalty logged         |
| Kill switch cascade               | POST /auth/killswitch → GET /sentinel/status            | CRITICAL alert in active_alerts                |
| Corruption then recovery          | POST /corrupt (incomplete) → POST /recover             | `issues_found` contains missing shard count    |
| API error propagation             | POST /shard with empty data                             | HTTP 400, frontend log shows real error message|

## 3.3 System Testing

| Test                       | Target                          | Result  |
|----------------------------|---------------------------------|---------|
| 21-node full mesh          | 100% connectivity at startup    | ✅ Pass |
| 30% node destruction       | Mesh self-healing status        | ✅ Pass |
| 80% node destruction       | BREACH status, CRITICAL threat  | ✅ Pass |
| Full reset after 80% attack| 100% connectivity restored      | ✅ Pass |
| Shard auto-recovery        | Lost shards re-routed post-reset| ✅ Pass |
| Biometric CL-5 auth        | Score > 0.90, clearance = 5     | ✅ Pass |
| Pydantic validation        | shard_size=0 → HTTP 422         | ✅ Pass |
| Frontend accessibility     | aria-label on all inputs        | ✅ Pass |

---

# Part 4: Contingency Plans

| Risk                        | Mitigation                                                         |
|-----------------------------|--------------------------------------------------------------------|
| Routing logic too complex   | Simplify to static Dijkstra; BFS is already implemented as fallback |
| Integration delays          | Each layer has independent REST endpoints — mock with static data  |
| Vercel Python timeout       | In-memory state resets per request — acceptable for simulation scope |
| Behind schedule             | Remove advanced visualization; focus on core routing + shard demo  |
| Cross-layer bugs            | Callbacks are optional (`onNetworkChange?`) — layers degrade gracefully |

---

# Part 5: Success Criteria

| Criteria                              | Target  | Status | Owner                |
|---------------------------------------|---------|--------|----------------------|
| Architecture Approved                 | Week 1  | ✅     | Architect            |
| Core Protocols Implemented            | Week 2  | ✅     | Engineer             |
| Biometric Auth Operational            | Week 2  | ✅     | Security Specialist  |
| React Dashboard Complete              | Week 3  | ✅     | DevOps               |
| Mesh Resilience Demonstrated          | Week 3  | ✅     | Tester/QA            |
| Cross-Layer Integration Working       | Week 3  | ✅     | Architect            |
| Error Simulation & Recovery Working   | Week 3  | ✅     | Tester/QA            |
| TypeScript Zero Errors                | Week 4  | ✅     | DevOps               |
| Accessibility Compliant               | Week 4  | ✅     | DevOps               |
| Documentation Complete                | Week 4  | ⬜     | All                  |
| Demo Scenario Rehearsed               | Week 4  | ⬜     | All                  |

---

## Approved By

Architect: ปริญญ์นกร อยู่แท้กูล
Engineer: ชนิณทร์ ใจช่วง
Security Specialist: ปุณยวีร์ แทนคำ
DevOps: พงศพัศ เลบ้านแท่น
Tester/QA: เมธัส มณีวิจิตร

Version: v1.0
Last Updated: 29/03/2026
