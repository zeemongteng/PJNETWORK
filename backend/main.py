"""
GBNL - Global Federal Network Line
Backend System v2.0

Architecture (4 Layers):
  Layer 1: Active Skin Interface  — Biometric Authentication & Kill Switch
  Layer 2: Ghost Web              — Decentralized Mesh Network (Micro-Sats + Drones)
  Layer 3: Void Protocol          — Data Sharding & Multi-Path Transmission
  Layer 4: The Sentinel           — AI Threat Detection & Tactical Haptics
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from pydantic import BaseModel
from typing import Optional
from enum import Enum
import hashlib, math, uuid, random, time
from datetime import datetime


app = FastAPI(title="GBNL Network System", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StripApiPrefixMiddleware(BaseHTTPMiddleware):
    """
    Strip the /api prefix added by Vercel's router before it reaches FastAPI.
    In development, Next.js already strips it via rewrites in next.config.ts.
    In production on Vercel, the route /api/(.*) → main.py preserves the full
    path, so FastAPI would receive /api/health instead of /health → 404.
    """
    async def dispatch(self, request: Request, call_next):
        if request.scope["path"].startswith("/api/"):
            request.scope["path"] = request.scope["path"][4:]  # /api/x → /x
        elif request.scope["path"] == "/api":
            request.scope["path"] = "/"
        return await call_next(request)

app.add_middleware(StripApiPrefixMiddleware)


# ===========================================================================
# ENUMS
# ===========================================================================

class NodeType(str, Enum):
    COMMAND_CENTER = "command_center"
    MICRO_SATELLITE = "micro_satellite"
    DRONE = "drone"
    GROUND_UNIT = "ground_unit"
    RELAY_STATION = "relay_station"


class NodeStatus(str, Enum):
    ACTIVE = "active"
    DEGRADED = "degraded"
    DESTROYED = "destroyed"


class ThreatType(str, Enum):
    JAMMING = "signal_jamming"
    INTERCEPTION = "data_interception"
    PHYSICAL_ATTACK = "physical_attack"
    CYBER_INTRUSION = "cyber_intrusion"
    COMPROMISE = "unit_compromise"


class ThreatLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class HapticPattern(str, Enum):
    ALERT_PULSE = "alert_pulse"
    DODGE_LEFT = "dodge_left"
    DODGE_RIGHT = "dodge_right"
    FREEZE = "freeze"
    RETREAT = "retreat"
    EMERGENCY = "emergency"


# ===========================================================================
# LAYER 2: GHOST WEB — MODELS
# ===========================================================================

class GBNLNode(BaseModel):
    id: str
    name: str
    type: NodeType
    status: NodeStatus = NodeStatus.ACTIVE
    x: float
    y: float
    health: int = 100
    frequency_band: str = "2.4GHz"
    connections: list[str] = []
    hops: int = 0  # frequency hops executed


class NetworkTopology(BaseModel):
    nodes: list[GBNLNode]
    connections: list[tuple[str, str]]
    active_nodes: int
    total_nodes: int
    connectivity_percent: float
    uptime_percent: float
    mesh_status: str


class AttackRequest(BaseModel):
    percentage: float = 30.0  # percent of non-CC nodes to destroy


class AttackResponse(BaseModel):
    destroyed: list[str]
    surviving_nodes: int
    connectivity_percent: float
    mesh_resilience: str


class HopResponse(BaseModel):
    nodes_hopped: int
    total_hops_executed: int
    new_frequencies: dict[str, str]
    message: str


# ===========================================================================
# LAYER 1: ACTIVE SKIN — MODELS
# ===========================================================================

class BiometricReading(BaseModel):
    unit_id: str
    pulse_bpm: int        # 40–200
    stress_level: float   # 0.0–1.0
    temperature_c: float  # 35.0–40.0
    iris_hash: str        # sha256 of iris scan (simulated)


class AuthSession(BaseModel):
    session_id: str
    unit_id: str
    status: str            # "active", "killed", "compromised"
    clearance_level: int   # 1–5
    created_at: str
    biometric_score: float


class AuthResponse(BaseModel):
    success: bool
    session: Optional[AuthSession] = None
    error: Optional[str] = None
    warning: Optional[str] = None


class KillSwitchRequest(BaseModel):
    unit_id: str
    session_id: str
    reason: str = "manual_trigger"


class KillSwitchResponse(BaseModel):
    success: bool
    unit_id: str
    data_wiped: bool
    hardware_destroyed: bool
    timestamp: str


# ===========================================================================
# LAYER 4: SENTINEL — MODELS
# ===========================================================================

class ThreatAlert(BaseModel):
    id: str
    type: ThreatType
    level: ThreatLevel
    description: str
    target_node: Optional[str] = None
    detected_at: str
    haptic_response: Optional[HapticPattern] = None
    resolved: bool = False


class SentinelStatus(BaseModel):
    overall_threat_level: ThreatLevel
    active_alerts: list[ThreatAlert]
    last_scan: str
    nodes_monitored: int
    anomalies_detected: int


class ScanResponse(BaseModel):
    threats_found: int
    new_alerts: list[ThreatAlert]
    sentinel_status: SentinelStatus


# ===========================================================================
# LAYER 3: VOID PROTOCOL — MODELS (unchanged from v1)
# ===========================================================================

class ShardRequest(BaseModel):
    data: str
    shard_size: int = 8


class Shard(BaseModel):
    message_id: str
    index: int
    total: int
    payload: str
    hash: str
    status: str = "transit"
    active: bool = True


class ShardResponse(BaseModel):
    message_id: str
    shards: list[Shard]
    total_shards: int
    original_length: int


class ReassembleRequest(BaseModel):
    shards: list[Shard]


class ReassembleResponse(BaseModel):
    success: bool
    data: str | None = None
    error: str | None = None


class CorruptionRequest(BaseModel):
    shards: list[Shard]
    corruption_type: str = "unsorted"


class CorruptionResponse(BaseModel):
    corrupted_shards: list[Shard]
    corruption_details: str
    status: str


class RecoveryRequest(BaseModel):
    shards: list[Shard]


class RecoveryResponse(BaseModel):
    success: bool
    recovered_data: str | None = None
    recovery_details: str
    issues_found: list[str]


# ===========================================================================
# GLOBAL STATE
# ===========================================================================

network_nodes: dict[str, GBNLNode] = {}
node_connections: list[tuple[str, str]] = []
auth_sessions: dict[str, AuthSession] = {}
threat_alerts: list[ThreatAlert] = []
last_scan_time: str = ""
total_uptime_snapshots: int = 100   # rolling counter for uptime calculation
healthy_snapshots: int = 100

FREQUENCY_BANDS = [
    "1.2 GHz", "2.4 GHz", "5.8 GHz",
    "24 GHz", "60 GHz", "Quantum-QKD",
    "Terahertz-T1", "Optical-IR",
]

THREAT_DESCRIPTIONS = {
    ThreatType.JAMMING: [
        "High-power RF jamming detected on {node} frequency band",
        "Broadband noise signal disrupting {node} communications",
    ],
    ThreatType.INTERCEPTION: [
        "Passive eavesdropping attempt on {node} uplink",
        "Deep-packet inspection probe targeting {node} traffic",
    ],
    ThreatType.PHYSICAL_ATTACK: [
        "Kinetic strike on {node} reported by proximity sensors",
        "Physical tampering detected on {node} hardware",
    ],
    ThreatType.CYBER_INTRUSION: [
        "Unauthorized access attempt on {node} admin interface",
        "Zero-day exploit probe detected at {node}",
    ],
    ThreatType.COMPROMISE: [
        "Biometric anomaly on unit assigned to {node}",
        "Session token replay attack originating near {node}",
    ],
}

HAPTIC_MAP: dict[ThreatType, HapticPattern] = {
    ThreatType.JAMMING: HapticPattern.ALERT_PULSE,
    ThreatType.INTERCEPTION: HapticPattern.FREEZE,
    ThreatType.PHYSICAL_ATTACK: HapticPattern.DODGE_LEFT,
    ThreatType.CYBER_INTRUSION: HapticPattern.ALERT_PULSE,
    ThreatType.COMPROMISE: HapticPattern.EMERGENCY,
}


# ===========================================================================
# LAYER 2: GHOST WEB ENGINE
# ===========================================================================

def init_network() -> None:
    """Build the default GBNL mesh topology (21 nodes)."""
    global network_nodes, node_connections

    nodes_raw = [
        # Command Center — center of the grid
        {"id": "cc-alpha", "name": "CMD-ALPHA", "type": NodeType.COMMAND_CENTER, "x": 450, "y": 350},

        # Micro-Satellites — orbital ring (r ≈ 280 from center)
        {"id": "sat-01", "name": "SAT-01", "type": NodeType.MICRO_SATELLITE, "x": 450, "y": 72},
        {"id": "sat-02", "name": "SAT-02", "type": NodeType.MICRO_SATELLITE, "x": 667, "y": 174},
        {"id": "sat-03", "name": "SAT-03", "type": NodeType.MICRO_SATELLITE, "x": 723, "y": 413},
        {"id": "sat-04", "name": "SAT-04", "type": NodeType.MICRO_SATELLITE, "x": 572, "y": 603},
        {"id": "sat-05", "name": "SAT-05", "type": NodeType.MICRO_SATELLITE, "x": 327, "y": 603},
        {"id": "sat-06", "name": "SAT-06", "type": NodeType.MICRO_SATELLITE, "x": 176, "y": 413},
        {"id": "sat-07", "name": "SAT-07", "type": NodeType.MICRO_SATELLITE, "x": 233, "y": 174},

        # Relay Stations — inner ring (r ≈ 145)
        {"id": "relay-n", "name": "RELAY-N", "type": NodeType.RELAY_STATION, "x": 450, "y": 208},
        {"id": "relay-e", "name": "RELAY-E", "type": NodeType.RELAY_STATION, "x": 592, "y": 350},
        {"id": "relay-s", "name": "RELAY-S", "type": NodeType.RELAY_STATION, "x": 450, "y": 492},
        {"id": "relay-w", "name": "RELAY-W", "type": NodeType.RELAY_STATION, "x": 308, "y": 350},

        # Drones — outer positions
        {"id": "drone-01", "name": "DRONE-01", "type": NodeType.DRONE, "x": 195, "y": 118},
        {"id": "drone-02", "name": "DRONE-02", "type": NodeType.DRONE, "x": 705, "y": 118},
        {"id": "drone-03", "name": "DRONE-03", "type": NodeType.DRONE, "x": 855, "y": 350},
        {"id": "drone-04", "name": "DRONE-04", "type": NodeType.DRONE, "x": 750, "y": 582},
        {"id": "drone-05", "name": "DRONE-05", "type": NodeType.DRONE, "x": 148, "y": 582},
        {"id": "drone-06", "name": "DRONE-06", "type": NodeType.DRONE, "x": 45, "y": 350},

        # Ground Units — lower area
        {"id": "gnd-01", "name": "UNIT-01", "type": NodeType.GROUND_UNIT, "x": 248, "y": 690},
        {"id": "gnd-02", "name": "UNIT-02", "type": NodeType.GROUND_UNIT, "x": 450, "y": 700},
        {"id": "gnd-03", "name": "UNIT-03", "type": NodeType.GROUND_UNIT, "x": 652, "y": 690},
    ]

    edges = [
        # CC ↔ Relays
        ("cc-alpha", "relay-n"), ("cc-alpha", "relay-e"),
        ("cc-alpha", "relay-s"), ("cc-alpha", "relay-w"),
        # Relays ↔ Satellites
        ("relay-n", "sat-01"), ("relay-n", "sat-02"), ("relay-n", "sat-07"),
        ("relay-e", "sat-02"), ("relay-e", "sat-03"),
        ("relay-s", "sat-04"), ("relay-s", "sat-05"),
        ("relay-w", "sat-05"), ("relay-w", "sat-06"), ("relay-w", "sat-07"),
        # Satellite ring
        ("sat-01", "sat-02"), ("sat-02", "sat-03"), ("sat-03", "sat-04"),
        ("sat-04", "sat-05"), ("sat-05", "sat-06"), ("sat-06", "sat-07"), ("sat-07", "sat-01"),
        # Drones ↔ Satellites / Relays
        ("drone-01", "sat-07"), ("drone-01", "sat-01"),
        ("drone-02", "sat-01"), ("drone-02", "sat-02"),
        ("drone-03", "sat-02"), ("drone-03", "sat-03"), ("drone-03", "relay-e"),
        ("drone-04", "sat-03"), ("drone-04", "sat-04"),
        ("drone-05", "sat-05"), ("drone-05", "sat-06"),
        ("drone-06", "sat-06"), ("drone-06", "sat-07"), ("drone-06", "relay-w"),
        # Ground Units ↔ Drones / Relay
        ("gnd-01", "drone-05"), ("gnd-01", "relay-s"),
        ("gnd-02", "relay-s"),
        ("gnd-03", "drone-04"), ("gnd-03", "relay-s"),
    ]

    network_nodes = {}
    for nd in nodes_raw:
        network_nodes[nd["id"]] = GBNLNode(
            id=nd["id"],
            name=nd["name"],
            type=nd["type"],
            x=nd["x"],
            y=nd["y"],
            frequency_band=random.choice(FREQUENCY_BANDS),
            connections=[],
        )

    node_connections = edges
    for a, b in edges:
        if a in network_nodes and b not in network_nodes[a].connections:
            network_nodes[a].connections.append(b)
        if b in network_nodes and a not in network_nodes[b].connections:
            network_nodes[b].connections.append(a)


def calculate_connectivity() -> float:
    """BFS from CC-ALPHA; return % of active nodes reachable."""
    if "cc-alpha" not in network_nodes:
        return 0.0
    active = {k for k, v in network_nodes.items() if v.status != NodeStatus.DESTROYED}
    if not active:
        return 0.0
    visited: set[str] = set()
    queue = ["cc-alpha"] if "cc-alpha" in active else []
    while queue:
        nid = queue.pop(0)
        if nid in visited:
            continue
        visited.add(nid)
        for conn in network_nodes[nid].connections:
            if conn in active and conn not in visited:
                queue.append(conn)
    return round(len(visited) / len(active) * 100, 2)


def mesh_status_label(connectivity: float, destroyed_pct: float) -> str:
    if connectivity >= 99:
        return "OPTIMAL — FULL MESH INTEGRITY"
    if connectivity >= 80:
        return "DEGRADED — MESH SELF-HEALING"
    if connectivity >= 50:
        return "CRITICAL — PARTIAL MESH ACTIVE"
    return "BREACH — MESH FRAGMENTED"


init_network()


# ===========================================================================
# LAYER 1: ACTIVE SKIN ENGINE
# ===========================================================================

def score_biometrics(reading: BiometricReading) -> tuple[float, Optional[str]]:
    """
    Validate biometric reading and return (score 0–1, warning_message | None).
    Score < 0.5 = authentication fails.
    Score >= 0.5 but stress > 0.85 = passes with KIA/stress warning.
    """
    score = 1.0
    warning = None

    # Pulse check
    if reading.pulse_bpm < 40 or reading.pulse_bpm > 200:
        return 0.0, "Pulse reading out of valid range — hardware fault or KIA"
    if reading.pulse_bpm < 45:
        score -= 0.6
        warning = "Extremely low pulse detected — possible KIA. Bio-Kill Switch armed."
    elif reading.pulse_bpm > 150:
        score -= 0.2
        warning = "Elevated pulse detected — high-stress scenario. Enhanced monitoring active."

    # Stress level
    if reading.stress_level > 0.92:
        score -= 0.3
        warning = "Critical stress threshold exceeded. Bio-Kill Switch pre-armed."
    elif reading.stress_level > 0.80:
        score -= 0.1
        warning = "High stress detected. Tactical alert issued."

    # Temperature
    if reading.temperature_c < 34.0 or reading.temperature_c > 41.0:
        score -= 0.5
        warning = "Body temperature anomaly — possible exposure or injury."

    # Iris hash validation (must be exactly 64 hex chars = sha256)
    if len(reading.iris_hash) != 64 or not all(c in "0123456789abcdef" for c in reading.iris_hash.lower()):
        score -= 0.5
        warning = "Iris scan invalid or tampered."

    return max(0.0, min(1.0, score)), warning


# ===========================================================================
# LAYER 4: SENTINEL ENGINE
# ===========================================================================

def _threat_level_from_network() -> ThreatLevel:
    total = len(network_nodes)
    destroyed = sum(1 for n in network_nodes.values() if n.status == NodeStatus.DESTROYED)
    pct = destroyed / total * 100 if total else 0
    if pct == 0:
        return ThreatLevel.NONE
    if pct < 15:
        return ThreatLevel.LOW
    if pct < 30:
        return ThreatLevel.MEDIUM
    if pct < 50:
        return ThreatLevel.HIGH
    return ThreatLevel.CRITICAL


def generate_threats(force_count: int = 0) -> list[ThreatAlert]:
    """Generate realistic threat alerts based on current network state."""
    new_alerts: list[ThreatAlert] = []
    network_level = _threat_level_from_network()

    # Base threat chance depends on network health
    base_chance = {
        ThreatLevel.NONE: 0.15,
        ThreatLevel.LOW: 0.30,
        ThreatLevel.MEDIUM: 0.55,
        ThreatLevel.HIGH: 0.75,
        ThreatLevel.CRITICAL: 0.95,
    }[network_level]

    threat_pool = list(ThreatType)
    degraded_nodes = [n for n in network_nodes.values() if n.status in (NodeStatus.ACTIVE, NodeStatus.DEGRADED)]

    count = force_count if force_count > 0 else random.randint(0, 2)
    for _ in range(count):
        if random.random() > base_chance and force_count == 0:
            continue
        threat_type = random.choice(threat_pool)
        target = random.choice(degraded_nodes).id if degraded_nodes else None
        level = random.choice([ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH])
        desc_template = random.choice(THREAT_DESCRIPTIONS[threat_type])
        desc = desc_template.format(node=target or "unknown node")
        alert = ThreatAlert(
            id=str(uuid.uuid4())[:8],
            type=threat_type,
            level=level,
            description=desc,
            target_node=target,
            detected_at=datetime.utcnow().isoformat() + "Z",
            haptic_response=HAPTIC_MAP.get(threat_type),
        )
        new_alerts.append(alert)
    return new_alerts


# ===========================================================================
# LAYER 3: VOID PROTOCOL ENGINE (unchanged logic from v1)
# ===========================================================================

class VoidProtocol:
    def __init__(self, shard_size: int = 8):
        self.shard_size = shard_size

    def shard_data(self, data: str) -> tuple[str, list[dict]]:
        message_id = str(uuid.uuid4())
        total = math.ceil(len(data) / self.shard_size)
        shards = []
        for i in range(total):
            fragment = data[i * self.shard_size:(i + 1) * self.shard_size]
            shards.append({
                "message_id": message_id,
                "index": i,
                "total": total,
                "payload": fragment,
                "hash": self._hash(fragment),
                "status": "transit",
                "active": True,
            })
        return message_id, shards

    def reassemble(self, shards: list[dict]) -> str:
        if not shards:
            raise ValueError("No shards provided")
        ids = {s["message_id"] for s in shards}
        if len(ids) != 1:
            raise ValueError("Shard mismatch: multiple message IDs")
        active = [s for s in shards if s.get("active", True)]
        expected = shards[0]["total"]
        if len(active) != expected:
            raise ValueError(f"Missing shard(s): have {len(active)}, need {expected}")
        sorted_shards = sorted(active, key=lambda x: x["index"])
        result = ""
        for s in sorted_shards:
            if s["hash"] != self._hash(s["payload"]):
                raise ValueError(f"Tampered shard at index {s['index']}")
            result += s["payload"]
        return result

    def simulate_corruption_unsorted(self, shards: list[dict]) -> tuple[list[dict], str]:
        corrupted = shards.copy()
        random.shuffle(corrupted)
        for s in corrupted:
            s["status"] = "corrupted"
        return corrupted, f"Shards shuffled — {len(corrupted)} fragments out of order"

    def simulate_corruption_incomplete(self, shards: list[dict]) -> tuple[list[dict], str]:
        keep = random.randint(1, max(1, len(shards) - 1))
        corrupted = random.sample(shards, keep)
        for s in corrupted:
            s["status"] = "corrupted"
        return corrupted, f"Incomplete: only {keep} of {len(shards)} shards present"

    def attempt_recovery(self, shards: list[dict]) -> tuple[str | None, list[str]]:
        issues: list[str] = []
        if not shards:
            issues.append("No shards")
            return None, issues
        ids = {s["message_id"] for s in shards}
        if len(ids) > 1:
            issues.append(f"Multiple message IDs: {len(ids)}")
        active = [s for s in shards if s.get("active", True)]
        expected = shards[0]["total"]
        if len(active) < expected:
            issues.append(f"Missing shards: {len(active)}/{expected} present")
        try:
            sorted_shards = sorted(active, key=lambda x: x["index"])
            result = ""
            hash_errors = 0
            for s in sorted_shards:
                if s["hash"] != self._hash(s["payload"]):
                    hash_errors += 1
                    issues.append(f"Hash mismatch at index {s['index']}")
                result += s["payload"]
            if hash_errors:
                issues.append(f"{hash_errors} shard(s) failed integrity check")
            if result and len(active) == expected:
                return result, issues
            elif result:
                issues.append(f"Partial recovery: {len(result)} chars from {len(active)} shards")
                return result, issues
        except Exception as e:
            issues.append(f"Recovery error: {e}")
        return None, issues

    @staticmethod
    def _hash(fragment: str) -> str:
        return hashlib.sha256(fragment.encode()).hexdigest()[:16]


# ===========================================================================
# API — LAYER 2: GHOST WEB
# ===========================================================================

@app.get("/network/topology", response_model=NetworkTopology)
async def get_topology() -> NetworkTopology:
    connectivity = calculate_connectivity()
    total = len(network_nodes)
    active = sum(1 for n in network_nodes.values() if n.status != NodeStatus.DESTROYED)
    destroyed = total - active
    destroyed_pct = destroyed / total * 100 if total else 0

    global healthy_snapshots, total_uptime_snapshots
    total_uptime_snapshots += 1
    if destroyed_pct < 30:
        healthy_snapshots += 1
    uptime = round(healthy_snapshots / total_uptime_snapshots * 100, 2)

    return NetworkTopology(
        nodes=list(network_nodes.values()),
        connections=node_connections,
        active_nodes=active,
        total_nodes=total,
        connectivity_percent=connectivity,
        uptime_percent=min(uptime, 99.99),
        mesh_status=mesh_status_label(connectivity, destroyed_pct),
    )


@app.post("/network/attack", response_model=AttackResponse)
async def attack_network(request: AttackRequest) -> AttackResponse:
    """Simulate enemy destroying a percentage of network nodes."""
    attackable = [
        n for n in network_nodes.values()
        if n.type != NodeType.COMMAND_CENTER and n.status == NodeStatus.ACTIVE
    ]
    count = max(1, round(len(attackable) * request.percentage / 100))
    targets = random.sample(attackable, min(count, len(attackable)))

    destroyed_ids: list[str] = []
    for node in targets:
        node.status = NodeStatus.DESTROYED
        node.health = 0
        destroyed_ids.append(node.id)

    connectivity = calculate_connectivity()
    total = len(network_nodes)
    surviving = sum(1 for n in network_nodes.values() if n.status != NodeStatus.DESTROYED)
    destroyed_pct = (total - surviving) / total * 100

    return AttackResponse(
        destroyed=destroyed_ids,
        surviving_nodes=surviving,
        connectivity_percent=connectivity,
        mesh_resilience=mesh_status_label(connectivity, destroyed_pct),
    )


@app.post("/network/reset")
async def reset_network() -> dict:
    """Restore all nodes to full health."""
    init_network()
    global healthy_snapshots, total_uptime_snapshots
    healthy_snapshots = 100
    total_uptime_snapshots = 100
    return {"status": "ok", "message": "Network fully restored", "nodes": len(network_nodes)}


@app.post("/network/hop", response_model=HopResponse)
async def frequency_hop() -> HopResponse:
    """
    Simulate frequency hopping across all active nodes.
    Changes every node's frequency band — executed millions of times per second in production.
    """
    hopped = 0
    new_freqs: dict[str, str] = {}
    for node in network_nodes.values():
        if node.status == NodeStatus.ACTIVE:
            node.frequency_band = random.choice(FREQUENCY_BANDS)
            node.hops += 1
            new_freqs[node.id] = node.frequency_band
            hopped += 1
    total_hops = sum(n.hops for n in network_nodes.values())
    return HopResponse(
        nodes_hopped=hopped,
        total_hops_executed=total_hops,
        new_frequencies=new_freqs,
        message=f"Frequency hopped on {hopped} nodes — interception window: <0.3 nanoseconds",
    )


# ===========================================================================
# API — LAYER 1: ACTIVE SKIN
# ===========================================================================

@app.post("/auth/verify", response_model=AuthResponse)
async def verify_biometrics(reading: BiometricReading) -> AuthResponse:
    """Verify biometric reading and issue a session token."""
    score, warning = score_biometrics(reading)

    if score < 0.5:
        return AuthResponse(
            success=False,
            error=warning or "Biometric verification failed — access denied",
        )

    # Check if this unit already has an active session
    for sess in auth_sessions.values():
        if sess.unit_id == reading.unit_id and sess.status == "active":
            return AuthResponse(
                success=True,
                session=sess,
                warning="Session already active for this unit ID",
            )

    clearance = 5 if score > 0.9 else (4 if score > 0.75 else 3)
    session = AuthSession(
        session_id=str(uuid.uuid4())[:16],
        unit_id=reading.unit_id,
        status="active",
        clearance_level=clearance,
        created_at=datetime.utcnow().isoformat() + "Z",
        biometric_score=round(score, 3),
    )
    auth_sessions[session.session_id] = session
    return AuthResponse(success=True, session=session, warning=warning)


@app.post("/auth/killswitch", response_model=KillSwitchResponse)
async def trigger_killswitch(request: KillSwitchRequest) -> KillSwitchResponse:
    """
    Trigger Bio-Kill Switch for a unit.
    Wipes session data and marks hardware for self-destruction.
    """
    session = auth_sessions.get(request.session_id)
    if not session or session.unit_id != request.unit_id:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "killed"

    # Also log a compromise alert
    alert = ThreatAlert(
        id=str(uuid.uuid4())[:8],
        type=ThreatType.COMPROMISE,
        level=ThreatLevel.CRITICAL,
        description=f"Bio-Kill Switch triggered for unit {request.unit_id} — reason: {request.reason}",
        detected_at=datetime.utcnow().isoformat() + "Z",
        haptic_response=HapticPattern.EMERGENCY,
    )
    threat_alerts.append(alert)

    return KillSwitchResponse(
        success=True,
        unit_id=request.unit_id,
        data_wiped=True,
        hardware_destroyed=True,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@app.get("/auth/sessions")
async def list_sessions() -> dict:
    return {
        "sessions": list(auth_sessions.values()),
        "active_count": sum(1 for s in auth_sessions.values() if s.status == "active"),
        "killed_count": sum(1 for s in auth_sessions.values() if s.status == "killed"),
    }


# ===========================================================================
# API — LAYER 4: SENTINEL
# ===========================================================================

@app.get("/sentinel/status", response_model=SentinelStatus)
async def sentinel_status() -> SentinelStatus:
    active_alerts = [a for a in threat_alerts if not a.resolved]
    level = _threat_level_from_network()
    if active_alerts:
        highest = max(
            [ThreatLevel.NONE, ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL],
            key=lambda x: ["none", "low", "medium", "high", "critical"].index(x.value),
        )
        levels_present = [a.level for a in active_alerts]
        order = ["none", "low", "medium", "high", "critical"]
        level = max(levels_present, key=lambda x: order.index(x.value))

    return SentinelStatus(
        overall_threat_level=level,
        active_alerts=active_alerts[-20:],  # last 20
        last_scan=last_scan_time or "Never",
        nodes_monitored=sum(1 for n in network_nodes.values() if n.status != NodeStatus.DESTROYED),
        anomalies_detected=len(active_alerts),
    )


@app.post("/sentinel/scan", response_model=ScanResponse)
async def sentinel_scan() -> ScanResponse:
    """Run Sentinel AI scan — generates threat alerts based on network state."""
    global last_scan_time
    last_scan_time = datetime.utcnow().isoformat() + "Z"

    new_alerts = generate_threats()
    threat_alerts.extend(new_alerts)

    status = await sentinel_status()
    return ScanResponse(
        threats_found=len(new_alerts),
        new_alerts=new_alerts,
        sentinel_status=status,
    )


@app.post("/sentinel/resolve/{alert_id}")
async def resolve_alert(alert_id: str) -> dict:
    for alert in threat_alerts:
        if alert.id == alert_id:
            alert.resolved = True
            return {"status": "resolved", "alert_id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")


@app.post("/sentinel/clear")
async def clear_alerts() -> dict:
    global threat_alerts
    threat_alerts = []
    return {"status": "ok", "message": "All alerts cleared"}


# ===========================================================================
# API — LAYER 3: VOID PROTOCOL
# ===========================================================================

@app.post("/shard", response_model=ShardResponse)
async def shard_data(request: ShardRequest) -> ShardResponse:
    protocol = VoidProtocol(shard_size=request.shard_size)
    message_id, shards = protocol.shard_data(request.data)
    return ShardResponse(
        message_id=message_id,
        shards=[Shard(**s) for s in shards],
        total_shards=len(shards),
        original_length=len(request.data),
    )


@app.post("/reassemble", response_model=ReassembleResponse)
async def reassemble_data(request: ReassembleRequest) -> ReassembleResponse:
    try:
        protocol = VoidProtocol()
        data = protocol.reassemble([s.model_dump() for s in request.shards])
        return ReassembleResponse(success=True, data=data)
    except ValueError as e:
        return ReassembleResponse(success=False, error=str(e))


@app.post("/corrupt", response_model=CorruptionResponse)
async def corrupt_shards(request: CorruptionRequest) -> CorruptionResponse:
    protocol = VoidProtocol()
    shards_dict = [s.model_dump() for s in request.shards]
    if request.corruption_type == "unsorted":
        corrupted, details = protocol.simulate_corruption_unsorted(shards_dict)
        status = "Shards out of order — reassembly will fail"
    elif request.corruption_type == "incomplete":
        corrupted, details = protocol.simulate_corruption_incomplete(shards_dict)
        status = "Incomplete shards — partial data only"
    else:
        return CorruptionResponse(corrupted_shards=[], corruption_details="Unknown type", status="Error")
    return CorruptionResponse(
        corrupted_shards=[Shard(**s) for s in corrupted],
        corruption_details=details,
        status=status,
    )


@app.post("/recover", response_model=RecoveryResponse)
async def recover_data(request: RecoveryRequest) -> RecoveryResponse:
    protocol = VoidProtocol()
    recovered, issues = protocol.attempt_recovery([s.model_dump() for s in request.shards])
    success = recovered is not None and len(issues) == 0
    if recovered and issues:
        details = f"Partial recovery: {len(recovered)} chars with {len(issues)} issue(s)"
    elif recovered:
        details = "Full recovery successful"
    else:
        details = f"Recovery failed: {len(issues)} issue(s)"
    return RecoveryResponse(
        success=success,
        recovered_data=recovered,
        recovery_details=details,
        issues_found=issues,
    )


# ===========================================================================
# API — SYSTEM
# ===========================================================================

@app.get("/health")
async def health() -> dict:
    active = sum(1 for n in network_nodes.values() if n.status != NodeStatus.DESTROYED)
    connectivity = calculate_connectivity()
    return {
        "status": "ok",
        "system": "GBNL Network System v2.0",
        "layers": {
            "ghost_web": f"{active}/{len(network_nodes)} nodes active, {connectivity:.1f}% connectivity",
            "active_skin": f"{sum(1 for s in auth_sessions.values() if s.status == 'active')} sessions active",
            "void_protocol": "operational",
            "sentinel": f"{sum(1 for a in threat_alerts if not a.resolved)} active alerts",
        },
    }


@app.get("/info")
async def info() -> dict:
    return {
        "name": "GBNL — Global Federal Network Line",
        "version": "2.0",
        "classification": "TOP SECRET // GBNL-ALPHA",
        "architecture": {
            "layer_1": "Active Skin Interface — Biometric Auth & Bio-Kill Switch",
            "layer_2": "Ghost Web — Decentralized Mesh (Micro-Sats + Drones + Frequency Hopping)",
            "layer_3": "Void Protocol — Data Sharding & Multi-Path Delivery",
            "layer_4": "The Sentinel — AI Threat Detection & Tactical Haptics",
        },
        "design_principles": [
            "No single point of failure (Decentralized Mesh)",
            "Zero signal leakage (Frequency Hopping, QKD)",
            "Absolute data sovereignty (Void Protocol sharding)",
            "Real-time threat response (Sentinel + Haptic feedback)",
            "Automatic key destruction (Bio-Kill Switch)",
        ],
    }
