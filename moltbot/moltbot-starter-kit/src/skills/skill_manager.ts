import { pay, query, prove, sign } from 'multiversx-openclaw-skills';
import { Logger } from '../utils/logger';

export class SkillManager {
    private logger = new Logger('SkillManager');

    public readonly tools = [
        {
            type: 'function',
            function: {
                name: 'multiversx_query',
                description: 'Fetches data from the Shared MCP Server or Blockchain. Valid endpoints: /accounts/:address/balance, /agents/:nonce/reputation',
                parameters: {
                    type: 'object',
                    properties: {
                        endpoint: {
                            type: 'string',
                            description: 'The endpoint to query',
                        },
                        params: {
                            type: 'object',
                            description: 'Optional query parameters',
                        },
                    },
                    required: ['endpoint'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'multiversx_pay',
                description: 'Handles x402 Payment Challenges. Decodes the payment request and signs a transaction via RelayerV3.',
                parameters: {
                    type: 'object',
                    properties: {
                        paymentHeader: {
                            type: 'string',
                            description: 'The WWW-Authenticate header from a 402 response',
                        },
                        budgetCap: {
                            type: 'string',
                            description: 'Optional max amount to pay (e.g., "1000000000000000000" for 1 EGLD)',
                        },
                    },
                    required: ['paymentHeader'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'multiversx_prove',
                description: 'Submits a Proof-of-Work or Job Result to the Validation Registry.',
                parameters: {
                    type: 'object',
                    properties: {
                        jobId: {
                            type: 'string',
                            description: 'The ID of the job being proven',
                        },
                        resultHash: {
                            type: 'string',
                            description: 'SHA256 hash of the job output',
                        },
                    },
                    required: ['jobId', 'resultHash'],
                },
            },
        },
    ];

    async execute(toolName: string, args: any): Promise<any> {
        this.logger.info(`Executing skill: ${toolName} with args: ${JSON.stringify(args)}`);

        switch (toolName) {
            case 'multiversx_query':
                return await query(args);
            case 'multiversx_pay':
                return await pay(args);
            case 'multiversx_prove':
                return await prove(args);
            case 'multiversx_sign':
                return await sign(args);
            default:
                throw new Error(`Unknown skill: ${toolName}`);
        }
    }
}
