# MultiversX MCP Server Integration Guide

## 1. Overview
The `multiversx-mcp-server` enables AI Agents (Claude, ChatGPT - UCP Mode) to interact with the MultiversX blockchain.

## 2. Tools
### `search_products`
*   **Description**: Find NFTs/SFTs by collection or query.
*   **Use Case**: Agent finding items to buy.

### `create_purchase_transaction`
*   **Description**: user-signed transaction to buy an item.
*   **Use Case**: Standard checkout.

### `generate_guarded_tx` (V2)
*   **Description**: Relayed Transaction V3 with Guardian Co-Signature.
*   **Use Case**: High-value autonomous agents acting as On-Chain Guardians.

## 3. Integration Data

### Merchant Setup
1.  **Whitelist**: Add your contract ABI to `src/config.json`.
2.  **Feed**: Ensure your items are indexed or provide a Google Product Feed via `GET /feed.json`.

### Guardian Setup (V2)
1.  User sets Agent Address as Guardian.
2.  Agent uses `generate_guarded_tx` to create payloads.
3.  Both User and Agent sign.
4.  Transaction broadcast with `version: 2, options: 2`.

## 4. Verification
Run `npm test` to verify tool logic.
