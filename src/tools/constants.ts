/**
 * Shared constants for MultiversX MCP Server
 */

export const USER_AGENT = "multiversx-mcp-server/1.0.0";

// Default gas limits for different transaction types
export const DEFAULT_GAS_LIMIT_EGLD = 50_000n;
export const DEFAULT_GAS_LIMIT_ESDT = 500_000n;
export const DEFAULT_GAS_LIMIT_NFT = 1_000_000n;
export const DEFAULT_GAS_LIMIT_ISSUE = 60_000_000n;
export const DEFAULT_GAS_LIMIT_MULTI_TRANSFER = 1_100_000n;

// ESDT issuance cost in atomic units (0.05 EGLD)
export const ESDT_ISSUE_COST = 50_000_000_000_000_000n;
