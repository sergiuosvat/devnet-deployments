# Configuration Guide

This guide details how to configure the MultiversX MCP Server for different environments (Mainnet, Devnet, Testnet).

## Environment Variables (.env)

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `MVX_NETWORK` | The network to connect to (`mainnet`, `devnet`, `testnet`). | `devnet` | Yes |
| `MVX_API_URL` | Custom API URL (overrides network default). | - | No |
| `MVX_WALLET_PEM` | Path to the wallet PEM file for signing transactions. | - | Yes (for Relayer/Signing) |
| `MVX_SIGNING_MODE` | Transaction signing mode (`signed`, `unsigned`). | `signed` | No |

## Registry Configuration (`src/config.json`)

The server uses a configuration file to locate the MX-8004 registries. You can customize these addresses for your specific deployment.

File Path: `src/config.json`

```json
{
    "registry_config": {
        "identity": "erd1...",    // Identity Registry Address
        "reputation": "erd1...",  // Reputation Registry Address
        "validation": "erd1..."   // Validation Registry Address
    },
    "api_url": "https://api.multiversx.com"
}
```

### Registry Roles
- **Identity**: Manages Agent IDs and profiles (NFTs).
- **Reputation**: Tracks agent trust scores and feedback.
- **Validation**: Verifies job completion proofs.

## Network Defaults

If `api_url` is not set in `config.json` or `MVX_API_URL`, the server defaults to:

- **Mainnet**: `https://api.multiversx.com`
- **Devnet**: `https://devnet-api.multiversx.com`
- **Testnet**: `https://testnet-api.multiversx.com`
