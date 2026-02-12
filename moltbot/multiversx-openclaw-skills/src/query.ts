import axios from 'axios';
import { DEFAULT_MCP_URL, MCP_QUERY_TIMEOUT } from './constants';

/**
 * Interface for the MCP Query Skill
 */
interface QueryParams {
    endpoint: string;
    params?: Record<string, unknown>;
    mcpUrl?: string; // Optional override, defaults to env
}

/**
 * Fetches data from the Shared MCP Server or related endpoints.
 * 
 * @param input QueryParams
 * @returns JSON response from the MCP server
 */
export async function query(input: QueryParams): Promise<unknown> {
    const baseUrl = input.mcpUrl || process.env.MULTIVERSX_MCP_URL || DEFAULT_MCP_URL;
    const url = `${baseUrl}${input.endpoint.startsWith('/') ? '' : '/'}${input.endpoint}`;

    try {
        console.log(`[MultiversX:Query] Fetching ${url}...`);
        const response = await axios.get(url, {
            params: input.params,
            timeout: MCP_QUERY_TIMEOUT
        });
        return response.data;
    } catch (error: unknown) {
        let message = 'Unknown error';
        if (error instanceof Error) {
            message = error.message;
        }

        console.error(`[MultiversX:Query] Error fetching ${url}:`, message);

        if (axios.isAxiosError(error) && error.response) {
            throw new Error(`MCP Query Failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}
