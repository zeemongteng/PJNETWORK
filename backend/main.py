import fastapi
import fastapi.middleware.cors
from pydantic import BaseModel
import hashlib
import math
import uuid


app = fastapi.FastAPI()

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
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
    corruption_type: str = "unsorted"  # unsorted, incomplete


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


# ---------------------------------------------------------------------------
# Void Protocol Implementation
# ---------------------------------------------------------------------------
class VoidProtocol:
    """
    Void Protocol - Data Sharding Security Model
    
    Concept:
    - Data fragmentation into shards
    - Multi-path delivery (simulated)
    - Reassembly at endpoint
    
    Security Model:
    - Intercepted shard = useless fragment
    - Requires all fragments for reconstruction
    - Hash verification for integrity
    """
    
    def __init__(self, shard_size: int = 8):
        self.shard_size = shard_size
    
    def shard_data(self, data: str) -> tuple[str, list[dict]]:
        """Split data into fragments with metadata"""
        if not isinstance(data, str):
            raise ValueError("VoidProtocol only supports string data")
        
        message_id = str(uuid.uuid4())
        shards = []
        total_shards = math.ceil(len(data) / self.shard_size)
        
        for index in range(total_shards):
            start = index * self.shard_size
            end = start + self.shard_size
            fragment = data[start:end]
            
            shard = {
                "message_id": message_id,
                "index": index,
                "total": total_shards,
                "payload": fragment,
                "hash": self._hash_fragment(fragment),
                "status": "transit",
                "active": True
            }
            shards.append(shard)
        
        return message_id, shards
    
    def reassemble(self, shards: list[dict]) -> str:
        """Reconstruct data from shard list"""
        if not shards:
            raise ValueError("No shards provided")
        
        # Validate same message ID
        message_ids = {shard["message_id"] for shard in shards}
        if len(message_ids) != 1:
            raise ValueError("Shard mismatch: Multiple message IDs detected")
        
        # Filter active shards
        active_shards = [s for s in shards if s.get("active", True)]
        
        # Validate shard count
        expected_total = shards[0]["total"]
        if len(active_shards) != expected_total:
            raise ValueError(f"Missing shard(s) detected. Have {len(active_shards)}, need {expected_total}")
        
        # Sort shards by index
        shards_sorted = sorted(active_shards, key=lambda x: x["index"])
        
        reconstructed_data = ""
        
        for shard in shards_sorted:
            # Integrity check
            if shard["hash"] != self._hash_fragment(shard["payload"]):
                raise ValueError(f"Tampered shard detected at index {shard['index']}")
            
            reconstructed_data += shard["payload"]
        
        return reconstructed_data
    
    def simulate_corruption_unsorted(self, shards: list[dict]) -> tuple[list[dict], str]:
        """Corrupt shards by randomizing their order - data will not sort properly"""
        import random
        corrupted = shards.copy()
        random.shuffle(corrupted)
        
        # Mark as corrupted in metadata
        for shard in corrupted:
            shard["status"] = "corrupted"
        
        details = f"Shards shuffled randomly - {len(corrupted)} shards out of order"
        return corrupted, details
    
    def simulate_corruption_incomplete(self, shards: list[dict]) -> tuple[list[dict], str]:
        """Corrupt by creating incomplete sharding - less than 16 shards"""
        import random
        
        # Keep only a random subset (between 1 and len-1)
        num_to_keep = random.randint(1, max(1, len(shards) - 1))
        corrupted = random.sample(shards, num_to_keep)
        
        # Mark as corrupted
        for shard in corrupted:
            shard["status"] = "corrupted"
        
        details = f"Incomplete sharding: Only {num_to_keep} of {len(shards)} shards created"
        return corrupted, details
    
    def attempt_recovery(self, shards: list[dict]) -> tuple[str | None, list[str]]:
        """Attempt to recover data from potentially corrupted shards"""
        issues = []
        
        if not shards:
            issues.append("No shards provided")
            return None, issues
        
        # Check for multiple message IDs
        message_ids = {shard["message_id"] for shard in shards}
        if len(message_ids) > 1:
            issues.append(f"Multiple message IDs detected: {len(message_ids)} different IDs")
        
        # Filter active shards
        active_shards = [s for s in shards if s.get("active", True)]
        if len(active_shards) < len(shards):
            issues.append(f"Inactive shards detected: {len(shards) - len(active_shards)} inactive")
        
        # Check shard count
        expected_total = shards[0]["total"] if shards else 0
        if len(active_shards) < expected_total:
            issues.append(f"Missing shards: Have {len(active_shards)}, expected {expected_total}")
        
        # Try to sort shards by index (recovery from unsorted)
        try:
            shards_sorted = sorted(active_shards, key=lambda x: x["index"])
            
            # Attempt to reassemble
            reconstructed_data = ""
            hash_errors = 0
            
            for shard in shards_sorted:
                # Check integrity
                expected_hash = self._hash_fragment(shard["payload"])
                if shard["hash"] != expected_hash:
                    hash_errors += 1
                    issues.append(f"Hash mismatch at shard {shard['index']}: expected {expected_hash}, got {shard['hash']}")
                    # Still include the shard data for partial recovery
                
                reconstructed_data += shard["payload"]
            
            if hash_errors > 0:
                issues.append(f"Integrity check: {hash_errors} shard(s) failed hash verification")
            
            if reconstructed_data and len(active_shards) == expected_total:
                return reconstructed_data, issues
            elif reconstructed_data:
                issues.append(f"Partial recovery possible: reconstructed {len(reconstructed_data)} chars")
                return reconstructed_data, issues
                
        except Exception as e:
            issues.append(f"Recovery attempt failed: {str(e)}")
        
        return None, issues
    
    @staticmethod
    def _hash_fragment(fragment: str) -> str:
        """Generate SHA-256 hash of fragment"""
        return hashlib.sha256(fragment.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "protocol": "void-protocol-v1.0"}


@app.post("/shard", response_model=ShardResponse)
async def shard_data(request: ShardRequest) -> ShardResponse:
    """
    Shard data into fragments using the Void Protocol.
    
    Each fragment contains:
    - message_id: Unique identifier for the message
    - index: Position of the shard in the sequence
    - total: Total number of shards
    - payload: The data fragment
    - hash: SHA-256 hash for integrity verification
    """
    protocol = VoidProtocol(shard_size=request.shard_size)
    message_id, shards = protocol.shard_data(request.data)
    
    return ShardResponse(
        message_id=message_id,
        shards=[Shard(**s) for s in shards],
        total_shards=len(shards),
        original_length=len(request.data)
    )


@app.post("/reassemble", response_model=ReassembleResponse)
async def reassemble_data(request: ReassembleRequest) -> ReassembleResponse:
    """
    Reassemble shards back into the original data.
    
    Validates:
    - All shards belong to the same message
    - All shards are present and active
    - Hash integrity of each shard
    """
    try:
        protocol = VoidProtocol()
        shards_dict = [s.model_dump() for s in request.shards]
        data = protocol.reassemble(shards_dict)
        return ReassembleResponse(success=True, data=data)
    except ValueError as e:
        return ReassembleResponse(success=False, error=str(e))


@app.get("/info")
async def protocol_info() -> dict:
    """Return information about the Void Protocol"""
    return {
        "name": "Void Protocol",
        "version": "1.0",
        "description": "Data Sharding Security Model for GBNL Network",
        "security_model": {
            "principle": "Intercepted shard = useless fragment",
            "requirements": "All fragments required for reconstruction",
            "integrity": "SHA-256 hash verification per shard"
        },
        "features": [
            "Data fragmentation into configurable shard sizes",
            "Multi-path delivery simulation",
            "Endpoint reassembly with integrity verification",
            "Tamper detection via hash mismatch"
        ]
    }


@app.post("/corrupt", response_model=CorruptionResponse)
async def corrupt_shards(request: CorruptionRequest) -> CorruptionResponse:
    """
    Simulate data corruption scenarios:
    - unsorted: Randomize shard order (data won't sort properly)
    - incomplete: Keep only subset of shards (< 16 shards)
    
    This endpoint is for testing recovery capabilities.
    """
    protocol = VoidProtocol()
    
    shards_dict = [s.model_dump() for s in request.shards]
    
    if request.corruption_type == "unsorted":
        corrupted, details = protocol.simulate_corruption_unsorted(shards_dict)
        status = "Data corrupted: Shards are out of order"
    elif request.corruption_type == "incomplete":
        corrupted, details = protocol.simulate_corruption_incomplete(shards_dict)
        status = "Data corrupted: Incomplete sharding detected"
    else:
        return CorruptionResponse(
            corrupted_shards=[],
            corruption_details="Unknown corruption type",
            status="Error"
        )
    
    return CorruptionResponse(
        corrupted_shards=[Shard(**s) for s in corrupted],
        corruption_details=details,
        status=status
    )


@app.post("/recover", response_model=RecoveryResponse)
async def recover_data(request: RecoveryRequest) -> RecoveryResponse:
    """
    Attempt to recover data from corrupted shards.
    
    Recovery capabilities:
    - Auto-sort shards by index
    - Identify missing shards
    - Verify hash integrity
    - Perform partial recovery if possible
    """
    protocol = VoidProtocol()
    
    shards_dict = [s.model_dump() for s in request.shards]
    recovered_data, issues = protocol.attempt_recovery(shards_dict)
    
    success = recovered_data is not None and len(issues) == 0
    
    details = "Recovery attempt completed"
    if recovered_data and issues:
        details = f"Partial recovery: {len(recovered_data)} chars recovered with {len(issues)} issue(s)"
    elif recovered_data:
        details = "Full recovery successful"
    elif issues:
        details = f"Recovery failed: {len(issues)} issue(s) detected"
    
    return RecoveryResponse(
        success=success,
        recovered_data=recovered_data,
        recovery_details=details,
        issues_found=issues
    )
