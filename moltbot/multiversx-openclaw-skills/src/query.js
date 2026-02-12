"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
/**
 * Fetches data from the Shared MCP Server or related endpoints.
 *
 * @param input QueryParams
 * @returns JSON response from the MCP server
 */
async function query(input) {
    const baseUrl = input.mcpUrl || process.env.MULTIVERSX_MCP_URL || constants_1.DEFAULT_MCP_URL;
    const url = `${baseUrl}${input.endpoint.startsWith('/') ? '' : '/'}${input.endpoint}`;
    try {
        console.log(`[MultiversX:Query] Fetching ${url}...`);
        const response = await axios_1.default.get(url, {
            params: input.params,
            timeout: constants_1.MCP_QUERY_TIMEOUT
        });
        return response.data;
    }
    catch (error) {
        let message = 'Unknown error';
        if (error instanceof Error) {
            message = error.message;
        }
        console.error(`[MultiversX:Query] Error fetching ${url}:`, message);
        if (axios_1.default.isAxiosError(error) && error.response) {
            throw new Error(`MCP Query Failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}
