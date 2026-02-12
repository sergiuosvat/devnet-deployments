"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_QUERY_TIMEOUT = exports.PROVE_GAS_LIMIT = exports.RELAYED_V3_EXTRA_GAS = exports.ESDT_TRANSFER_GAS = exports.SC_CALL_MIN_GAS = exports.GAS_PER_DATA_BYTE = exports.BASE_GAS_LIMIT = exports.DEFAULT_CHAIN_ID = exports.DEFAULT_MCP_URL = void 0;
/**
 * Default URLs
 */
exports.DEFAULT_MCP_URL = 'http://localhost:3000';
exports.DEFAULT_CHAIN_ID = 'D';
/**
 * Gas Constants
 */
exports.BASE_GAS_LIMIT = 50000;
exports.GAS_PER_DATA_BYTE = 1500;
exports.SC_CALL_MIN_GAS = 6000000;
exports.ESDT_TRANSFER_GAS = 200000;
exports.RELAYED_V3_EXTRA_GAS = 50000;
exports.PROVE_GAS_LIMIT = 10000000;
/**
 * Timeouts
 */
exports.MCP_QUERY_TIMEOUT = 5000;
