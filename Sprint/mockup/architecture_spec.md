# GBNL Network Architecture Specification v1.0
**Architectural Review Document - CP352005 Networks**

Project: Global Federal Network Line (GBNL)  
Course: Undergraduate Computer Networks  

---

## Document Control

| Version | Date | Author | Role | Changes |
|---------|------------|-----------------|------|----------|
| v1.0    | 20/02/2026 | ปริญญ์นกร อยู่แท้กูล | Architect | Initial architectural specification |

---

## Team Roles

| Role | Name | Responsibilities |
|------|------|------------------|
| **Architect**           | ปริญญ์นกร อยู่แท้กูล   | System design, layered architecture, interface contracts |
| **Engineer**            | ชนิณทร์ ใจช่วง       | Protocol design, routing simulation, mesh implementation |
| **Security Specialist** | ปุณยวีร์ แทนคำ       |Encryption, zero-trust model, threat modeling            |
| **DevOps**              | พงศพัศ เลบ้านแท่น    | Simulation environment, CI/CD, integration |
| **Tester/QA**           | เมธัส มณีวิจิตร        | Test planning, fault injection, resilience validation |

---

# Part 1: Executive Summary

## 1.1 Project Vision

GBNL (Global Federal Network Line) is a decentralized, mesh-based, quantum-inspired military communication architecture designed to eliminate single points of failure, reduce latency, and enhance battlefield survivability.

The project demonstrates understanding of:

- Decentralized network architecture
- Mesh routing protocols
- Secure distributed systems
- Multi-layer network abstraction
- Simulation-based validation

---

## 1.2 Educational Objectives

- Apply OSI layered principles to futuristic architecture
- Design decentralized routing mechanisms
- Simulate self-healing mesh networks
- Model zero-trust authentication systems
- Analyze network resilience under node failure
- Implement secure data fragmentation protocol

---

## 1.3 Scope and Constraints

| Aspect | In Scope | Out of Scope |
|--------------|-----------------------------|--------------------------|
| Architecture | Layered network stack       | Real quantum hardware    |
| Simulation   | Python mesh simulation      | Satellite launch systems |
| Encryption   | Simulated quantum key logic | Real QKD hardware        |
| Testing      | Node failure simulation     | Military deployment      |

---

# Part 2: Architectural Overview

## 2.1 GBNL Layered Architecture






┌──────────────────────────────────────────────────────────┐
│ Application Layer │ Tactical Command Interface    │
├──────────────────────────────────────────────────────────┤
│ Feedback Layer    │ Tactical Haptic System        │
├──────────────────────────────────────────────────────────┤
│ Protocol Layer    │ Void Protocol (Data Sharding) │
├──────────────────────────────────────────────────────────┤
│ Network Layer     │ Adaptive Mesh Routing (AMR)   │
├──────────────────────────────────────────────────────────┤
│ Data Link Layer   │ Swarm Sync Link (SSL)         │
├──────────────────────────────────────────────────────────┤
│ Physical Layer    │ Ghost Web Nodes (Simulated)   │
└──────────────────────────────────────────────────────────┘



---

# 2.2 Layer-by-Layer Architectural Review

---

## 2.2.1 Physical Layer – Ghost Web Nodes (Simulated)

**Design Review Status: ✅ Approved**

Simulated components:
- Micro-satellite nodes
- Drone relay nodes
- Soldier wearable nodes

### Interface Definition

```python
import random
import time


class PhysicalNode:
    def __init__(self, node_id, reliability=0.95):
        """
        node_id: unique identifier
        reliability: probability of successful transmission (0-1)
        """
        self.node_id = node_id
        self.reliability = reliability
        self.health = 100
        self.active = True

    # --------------------------------------------------
    # Simulate Packet Transmission
    # --------------------------------------------------
    def transmit(self, packet, destination):
        """Simulate packet transmission"""

        if not self.active:
            print(f"Node {self.node_id} is offline.")
            return False

        # Simulated latency
        latency = random.uniform(0.01, 0.2)
        time.sleep(latency)

        # Simulated packet success
        if random.random() <= self.reliability:
            print(f"Node {self.node_id} → {destination}: Packet delivered.")
            return True
        else:
            print(f"Node {self.node_id} → {destination}: Packet lost.")
            self._degrade_health()
            return False

    # --------------------------------------------------
    # Detect Node Failure
    # --------------------------------------------------
    def detect_failure(self):
        """Return node health status"""

        if self.health <= 0:
            self.active = False

        status = {
            "node_id": self.node_id,
            "health": self.health,
            "active": self.active
        }

        return status

    # --------------------------------------------------
    # Internal: Health Degradation
    # --------------------------------------------------
    def _degrade_health(self):
        damage = random.randint(5, 15)
        self.health -= damage

        if self.health < 0:
            self.health = 0
            self.active = False

    # --------------------------------------------------
    # Optional: Repair Node
    # --------------------------------------------------
    def repair(self, amount=20):
        if not self.active:
            self.active = True

        self.health += amount
        if self.health > 100:
            self.health = 100
