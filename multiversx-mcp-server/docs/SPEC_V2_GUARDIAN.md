# UCP V2 Specification: MultiversX Guardian

## 1. Overview
This specification aligns the Universal Commerce Protocol (UCP) with MultiversX's native **Guardian** feature. It enables "True Agentic Security" where the Agent is an on-chain co-signer (Guardian) rather than holding the user's private key.

## 2. Payment Handler Definition
We define `org.multiversx.relayed` as a UCP Payment Handler.

```json
{
  "handler_id": "org.multiversx.relayed",
  "capability": "dev.ucp.payment.token_exchange",
  "client_parameters": {
    "receiver_address": "string",
    "token_identifier": "string",
    "relayer_address": "string"
  }
}
```

## 3. The Guardian Flow

### 3.1. Setup (One-Time)
1.  **Discovery**: Agent creates a new MultiversX Address (The "Agent Wallet").
2.  **Authorization**: User sends a `SetGuardian` transaction to the blockchain, designating the "Agent Wallet" as their Guardian.
    *   *Service*: `multiversx-guardians-service` (TCB).
    *   *Cooldown*: 20 days (standard) or same-block (if replacing).

### 3.2. Execution (Per Transaction)
1.  **Construction**: Agent constructs the transaction (e.g., `buyNft`).
2.  **Co-Signing**:
    *   **Signer 1 (User)**: The User's primary key signs the tx (or a "Mandate" pre-signed by the user is used).
    *   **Signer 2 (Agent)**: The Agent signs the tx hash as the Guardian.
3.  **Relaying**: The MCP Server (or Agent) broadcasts the specific "Guarded Transaction" payload.

## 4. MCP Server Implementation

The `multiversx-mcp-server` needs a new tool: `generate_guardian_payload`.

### Tool: `generate_guardian_payload`
*   **Input**:
    *   `tx_data`: The transaction data (e.g., `buy@...`).
    *   `user_address`: The user's address.
    *   `guardian_address`: The Agent's address.
*   **Output**:
    *   A JSON object containing the payload formatted for a Guardians V2 transaction.
    *   Format: `RelayedTx` wrapping the Guarded Tx.

## 5. Security Benefits
*   **Revocability**: User can unset the Guardian at any time on-chain.
*   **Limits**: Guardians can be configured with "Usability" settings (e.g., only sign for X EGLD).
