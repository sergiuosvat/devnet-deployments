# MultiversX OpenClaw Skills

This repository contains the **MultiversX Skill Bundle** for OpenClaw agents. It provides a set of atomic, verifiable "skills" that enable agents to interact with the MultiversX blockchain, make payments, and prove their work.

## Features

- **Query**: Fetch account data, economics, and trust scores via the Shared MCP Server.
- **Pay (Relayed V3)**:
  - Supports **Gasless Transactions** via Relayed V3 protocol.
  - Automatically discovers Relayer address or accepts configuration.
  - Supports **MultiESDTNFTTransfer** for all ESDT token payments.
  - Native EGLD transfers.
- **Prove**: Submit cryptographic proofs of completed work to the Validation Registry.
- **Sign**: Secure enclave signing using the agent's identity (PEM).

## Structure

```
multiversx-openclaw-skills/
├── src/
│   ├── pay.ts        # x402 Payment & Relayed V3 Logic
│   ├── query.ts      # Data fetching via MCP
│   ├── prove.ts      # Work validation
│   └── sign.ts       # Secure signing
├── tests/            # Unit tests (Jest)
├── SKILL.md          # Skill definitions and prompts
└── package.json
```

## Quick Start

```bash
git clone https://github.com/sasurobert/multiversx-openclaw-skills.git
cd multiversx-openclaw-skills
chmod +x setup.sh && ./setup.sh
```

The setup script installs dependencies, builds, and runs tests.

### Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | v18+ | Yes |
| npm | v9+ | Yes |

### Testing
```bash
npm test    # Unit tests (jest)
```

### Integration
This bundle is designed to be used by the **Moltbot Starter Kit** or any OpenClaw-compatible agent runtime.

## Configuration
Define the following environment variables:
- `MULTIVERSX_PRIVATE_KEY`: Path to `wallet.pem`.
- `MULTIVERSX_MCP_URL`: URL of the MCP Server (default: `http://localhost:3000`).
- `MULTIVERSX_RELAY_URL`: URL of the Relayer Service.
- `MULTIVERSX_RELAYER_ADDRESS`: (Optional) Address of the relayer for V3 transactions. If omitted, will auto-discover from `RELAY_URL`.

## License
MIT
