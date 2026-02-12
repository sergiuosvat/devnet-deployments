import { prove } from '../src/prove';
import { UserSigner } from '@multiversx/sdk-wallet';
import { promises as fs } from 'fs';
import axios from 'axios';

jest.mock('axios');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));

describe('MultiversX Prove Skill', () => {
    const mockPem = `-----BEGIN PRIVATE KEY for erd1q...-----
MOCK_PEM_CONTENT
-----END PRIVATE KEY for erd1q...-----`;

    beforeEach(() => {
        (fs.readFile as jest.Mock).mockResolvedValue(mockPem);
        (axios.post as jest.Mock).mockResolvedValue({ data: { txHash: '0xhash' } });
        (axios.get as jest.Mock).mockResolvedValue({ data: { nonce: 42 } });
        process.env.MULTIVERSX_VALIDATION_REGISTRY = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
    });

    it('should submit proof via MCP', async () => {
        const mockSigner = {
            getAddress: () => ({ bech32: () => 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu' }),
            sign: jest.fn().mockResolvedValue(Buffer.from('signature'))
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(UserSigner, 'fromPem').mockReturnValue(mockSigner as any);

        const result = await prove({
            jobId: 'job-123',
            resultHash: 'abcdef123456',
            walletPath: 'dummy.pem'
        });

        expect(result).toBe('0xhash');
        expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/transactions', expect.any(Object));

        // Data Verification: submit_proof@jobHex@hash
        const postCall = (axios.post as jest.Mock).mock.calls[0][1];
        expect(postCall.data).toBeDefined();
    });
});
