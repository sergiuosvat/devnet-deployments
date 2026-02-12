# Technical Specification: MultiversX UCP Integration (MCP Server)

## 1. Overview
This specification details the architecture for the **MultiversX Model Context Protocol (MCP) Server**. This server will act as the bridge between UCP-compliant AI Agents (Google Gemini, Claude, etc.) and the MultiversX Blockchain.

**Goal**: Enable an AI Agent to:
1.  **Discovery**: Find NFTs or Tokens for sale.
2.  **Commerce**: Create a purchase transaction.

## 2. Architecture
The solution will be a standalone **TypeScript MCP Server** using the official `@modelcontextprotocol/sdk`.

```mermaid
graph LR
    Agent[AI Agent (Claude/Google)] -- MCP Protocol --> Server[MultiversX MCP Server]
    Server -- API/Elastic --> BN[MultiversX API]
    Server -- JSON --> Agent
    Agent -- Signature --> Wallet[User Wallet]
    Wallet -- Submit --> Blockchain
```

## 3. Schema Definitions

### 3.1. Tool: `search_products`
Allows the agent to find purchasable items.

**Input Schema:**
```json
{
  "query": { "type": "string", "description": "Search keywords (e.g. 'Bored Ape', 'EGLD')" },
  "collection": { "type": "string", "description": "Optional Collection Identifier" },
  "limit": { "type": "number", "default": 5 }
}
```

**Output Schema (List of Products):**
```json
[
  {
    "id": "NFT-123456-01",
    "name": "SuperRare #1",
    "description": "Rare digital art",
    "price": "1.5 EGLD",
    "image_url": "https://...",
    "availability": "in_stock",
    "metadata": {
      "nonce": 1,
      "token_identifier": "NFT-123456"
    }
  }
]
```

### 3.2. Tool: `create_purchase_transaction`
Generates the *unsigned* transaction payload. The Agent cannot sign itself (usually), it presents this payload to the user or a "Wallet Tool".

**Input Schema:**
```json
{
  "product_id": { "type": "string", "description": "The unique ID (Identifier-Nonce) of the item to buy" },
  "quantity": { "type": "number", "default": 1 }
}
```

**Output Schema (Transaction Payload):**
```json
{
  "status": "ready_to_sign",
  "chain_id": "1",
  "transactions": [
    {
      "receiver": "erd1marketplace...",
      "value": "1500000000000000000",
      "gasLimit": 20000000,
      "data": "buy@4e46542d313233@01" 
    }
  ]
}
```

## 4. Implementation Details

### 4.1. Data Source
We will use the **MultiversX Public API** (e.g., `api.multiversx.com`) to query listings.
*   *Search*: `/nfts?search={query}&status=onSale` (This assumes API supports sale status filtering, or we filter locally).

### 4.2. Transaction Construction
We will use `@multiversx/sdk-core` to construct the data field.
*   **Format**: `ESDTNFTTransfer` or Marketplace-specific `buy` function calls.
*   The server will *not* hold private keys.

## 5. Development Roles
*   **Developer**: Initializes repo, sets up MCP SDK, maps API response to UCP schemas.
*   **Verifier**: Runs `mcp-inspector` to test tool calls.
