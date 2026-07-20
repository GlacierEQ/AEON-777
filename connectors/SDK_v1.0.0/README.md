# 🌲 Aspen Grove Unified Connector SDK v1.0.0

**Production-ready integration framework for 14 cloud services**  
*L7-Pointer Architecture | Aspen Grove Legal Filing System*

---

## Overview

The Aspen Grove Unified Connector SDK provides a single, cohesive interface for managing 14 cloud connectors:

| Tier | Service | Status |
|------|---------|--------|
| **Critical** | GitHub, Dropbox, OneDrive | ✅ Active |
| **Operational** | Google Drive, Box, Gmail, Notion | ✅ Active |
| **Specialized** | AssemblyAI, CourtListener, Mem0 | ⏳ Some issues |
| **Integration** | Composio, Docusign | ✅ Active |

---

## Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/glaciereq/aspen-grove-connectors.git
cd aspen-grove-connectors
./setup.sh
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your connection IDs
```

### 3. Run
```bash
# Native Python
python3 connector_sdk.py

# Docker
make docker-build
make docker-run
```

---

## Architecture

### L7-Pointer Reference Model

```
┌─────────────────────────────────────┐
│   Aspen Grove Public Gateway        │  (aspen-grove-public-gateway)
│   - Read-only public reference      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   L7 Pointer Vault                  │  (glaciereq/AEON-777)
│   - Durable pointer to all connectors│
│   - GitHub PR commits               │
│   - Storage destinations            │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   Connector Registry                │  (CONNECTOR_REGISTRY.json)
│   - 14 services indexed             │
│   - Health status                   │
│   - Capability mapping              │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│   Unified SDK                       │  (connector_sdk.py)
│   - Factory pattern                 │
│   - Health checks                   │
│   - Deployment orchestration        │
└─────────────────────────────────────┘
```

---

## Usage

### List All Connectors
```python
from connector_sdk import AspenGroveConnectorSDK

sdk = AspenGroveConnectorSDK()

# Get all connectors
all_connectors = sdk.list_connectors()

# Get active/ready connectors
active = sdk.get_active_connectors()
print(f"Ready to use: {len(active)}")
```

### Check Connector Status
```python
# Get specific connector
github = sdk.get_by_service("GitHub")
print(github['status'])  # "active"

# Check if ready
is_ready = sdk.is_ready(github['id'])
print(is_ready)  # True
```

### Get Storage Destinations
```python
# Map all storage paths by tier
destinations = sdk.get_storage_destinations()

for tier, services in destinations.items():
    print(f"{tier}:")
    for service, config in services.items():
        print(f"  {service}: {config['paths']}")
```

### Generate Deployment Config
```python
# Create deployment configuration
config = sdk.generate_deployment_config()

# Deploy order
for conn_id in config['deployment_order']:
    print(f"Deploy: {conn_id}")

# Export to YAML
import yaml
with open('deployment.yaml', 'w') as f:
    yaml.dump(config, f)
```

### Health Check
```python
# Run comprehensive health check
health = sdk.generate_healthcheck()

print(f"Status: {health['active']}/{health['total_connectors']} active")
print(f"Ready: {'✅' if health['deployment_ready'] else '⚠️'}")

# Review issues
for issue in health['issues']:
    print(f"⚠️  {issue['service']}: {issue['status']}")
```

---

## Connector Details

### Tier 1: Critical (Deploy First)

**GitHub** (`conn_pm0st691a0bch4bms6b1`)
- Primary vault: `glaciereq/AEON-777`
- Public gateway: `aspen-grove-public-gateway` (pending creation)
- Capabilities: PR creation, branch management, releases

**Dropbox** (`conn_kecdqn5wpjbcem5hxyn6`)
- Primary path: `/GDrive/GLACIER_EQUILIBRIUM/JEFS_FILING_READY/`
- Status: ⚠️ Tool path errors (recoverable)

**OneDrive** (`conn_jvcvday0pkewfey4magc`)
- Filing packages path: `/filing-packages/`
- Status: ✅ Active & verified

### Tier 2: Operational

- **Google Drive**: Read-only forensic evidence
- **Box**: Secondary cloud storage
- **Gmail**: Communication (glacier.equilibrium@gmail.com)
- **Notion**: Documentation & database

### Tier 3: Specialized

- **AssemblyAI**: Audio transcription (3 failed jobs - recoverable)
- **Smithery whisperX**: Alternative transcription API
- **CourtListener**: Legal case database search
- **Mem0**: Memory/context (401 auth error - key regeneration needed)
- **Egnyte**: Enterprise storage (reauth pending)

### Tier 4: Integration

- **Composio**: Universal API gateway
- **Docusign**: E-signature management

---

## Deployment

### Native Python
```bash
make setup
make healthcheck
make dev
```

### Docker
```bash
make docker-build
make docker-run
make docker-logs
```

### Docker Compose
```yaml
services:
  aspen-grove-connectors:
    build: .
    environment:
      ENVIRONMENT: production
      ASPEN_GROVE_L7_ENABLED: true
    volumes:
      - ./.env:/app/.env:ro
```

---

## Configuration

### Environment Variables

Key variables in `.env`:

```bash
# GitHub
GITHUB_PRIMARY_REPO=glaciereq/AEON-777
GITHUB_PUBLIC_GATEWAY=aspen-grove-public-gateway

# Storage
DROPBOX_PRIMARY_PATH=/GDrive/GLACIER_EQUILIBRIUM/JEFS_FILING_READY/
ONEDRIVE_FILING_PATH=/filing-packages/

# Deployment
ENVIRONMENT=production
ASPEN_GROVE_L7_ENABLED=true
```

### Deployment YAML

See `connector_deployment.yaml` for full configuration:
- Tier ordering
- Health check schedules
- Retry policies
- Security settings

---

## Health Checks

### Automated Health Checks
```bash
# Run manually
make healthcheck

# View in deployment logs
docker-compose logs aspen-grove-connectors
```

### Known Issues & Recovery

| Service | Issue | Recovery |
|---------|-------|----------|
| **Dropbox** | Tool path errors on upload | Retry with fresh connection |
| **AssemblyAI** | 3 failed transcriptions | Rerun with fresh file sources |
| **Mem0** | 401 authentication error | Regenerate keys at app.mem0.ai |
| **Egnyte** | Reauth pending | Verify operational status |

---

## Development

### Running Tests
```bash
make test
```

### Code Style
```bash
black connector_sdk.py
flake8 connector_sdk.py
mypy connector_sdk.py
```

---

## Aspen Grove Integration

This SDK is part of the **Aspen Grove Legal Filing System** architecture:

1. **JEFS Filing Pipeline**: Draft → Check → Verify → Finalize → Save → Push
2. **L7-Pointer Vault**: All connectors referenced in `glaciereq/AEON-777`
3. **Public Gateway**: Read-only access via `aspen-grove-public-gateway` (pending)
4. **Multi-destination Delivery**: GitHub → Dropbox → OneDrive (parallel push)

---

## Troubleshooting

### Connector Won't Initialize
```bash
# Check registry file exists
ls -lh CONNECTOR_REGISTRY.json

# Check Python path
python3 -c "import json; print('✓ JSON support')"
```

### Health Check Fails
```bash
# Run with verbose logging
LOGLEVEL=DEBUG python3 connector_sdk.py

# Check specific connector
python3 << 'EOF'
from connector_sdk import AspenGroveConnectorSDK
sdk = AspenGroveConnectorSDK()
github = sdk.get_by_service("GitHub")
print(f"GitHub status: {github['status']}")
EOF
```

### Docker Build Issues
```bash
# Clear cache
docker system prune -a

# Rebuild
make docker-build

# Check image
docker images aspen-grove-connectors
```

---

## License

Part of the **Aspen Grove Legal Filing System**  
Repository: `glaciereq/AEON-777`

---

## Support

- Primary Vault: https://github.com/glaciereq/AEON-777
- Registry: `CONNECTOR_REGISTRY.json`
- SDK Docs: See docstrings in `connector_sdk.py`

**Built with L7-Pointer Architecture** 🌲
