# Merchant & Marketplace Guide: Integrating MultiversX UCP

## Overview
This guide explains how **Marketplaces** (e.g., XOXNO, FrameIt) and **dApps** on MultiversX can make their listings discoverable and purchasable by AI Agents (via MCP) and Google Shopping (via UCP).

By integrating, your products become available to:
1.  **AI Agents**: Claude, Gemini, and open-source models using the Agentic Commerce Protocol.
2.  **Google Search**: Product listings in "Shop with AI" surfaces (requires Feed connection).

## Integration Checklist
To become "Agent-Ready", you must complete the following steps:

1.  [ ] **Whitelist your Contract**: Submit a PR to the official MCP Server.
2.  [ ] **Configure your Checkout ABI**: Ensure Agents know how to call your `buy` function.
3.  [ ] **Verify your Feed**: confirm your items appear in the standard `feed.json`.

---

## Step 1: Whitelist your Contract
The MultiversX MCP Server (`multiversx-mcp-server`) acts as a secure bridge. It only indexes listings from **Trusted Contracts** defined in its configuration.

### Action
1.  Fork the [multiversx-mcp-server repository](https://github.com/multiversx/multiversx-mcp-server).
2.  Open `src/config.json`.
3.  Add your marketplace definition under `contracts_config` and `marketplaces`.

**Example `src/config.json`:**
```json
{
  "marketplaces": [
    {
      "name": "MyMarketplace",
      "contracts": ["erd1...my_contract_address"], 
      "trust_level": "verified"
    }
  ]
}
```

---

## Step 2: Configure Checkout ABI
AI Agents need to know exactly how to construct a purchase transaction for your contract.
*   **Standard function**: `buy` (takes `token_identifier`, `nonce`, `quantity`).
*   **Custom function**: If you use `buyNft` or `swap`, you must define it.

### Action
In the same `src/config.json`, add your ABI definition under `contracts_config`:

```json
"contracts_config": {
  "mymarketplace": {
    "address": "erd1...my_contract_address",
    "abi": {
      "function": "buyNft", 
      "args_order": ["token_identifier", "nonce", "quantity"]
    }
  }
}
```
*Note: The `args_order` tells the agent in which order to pass parameters. Supported args: `token_identifier`, `nonce`, `quantity`.*

---

## Step 3: Validate Integration
Once your PR is merged and deployed, verify your integration.

### Test Product Search
Run a local instance or query the public MCP server:
```bash
# Request via MCP
{
  "name": "search_products",
  "arguments": { "collection": "MYCOL-123456" }
}
```
*You should see your items in the response.*

### Test Google Feed
Access the HTTP Feed endpoint to see how Google sees your products:
`GET https://mcp.multiversx.com/feed.json`

Check that your items have:
*   `id`: `TokenIdentifier-Nonce`
*   `price`: Correct value and currency (EGLD)
*   `link`: Deep-link to your buying interface.

---

## FAQ

**Q: Do I need to run my own MCP Server?**
A: No. You only need to be whitelisted in the *public official* server. However, you *can* run your own server if you want to provide a private feed to specific agents.

**Q: How do I get my Feed into Google Merchant Center?**
A: Once verified, take the URL of the deployed MCP server (`/feed.json`) and add it as a "Scheduled Fetch" Data Feed in your Google Merchant Center dashboard.
