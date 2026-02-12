import { pay } from '../src/pay';
import { UserSigner } from '@multiversx/sdk-wallet';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';
import { promises as fs } from 'fs';
import axios from 'axios';

jest.mock('axios');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));
jest.mock('@multiversx/sdk-network-providers');

describe('MultiversX Pay Skill (Relayed V3)', () => {
    const mockPem = `-----BEGIN PRIVATE KEY for erd1q...-----
MOCK_PEM_CONTENT
-----END PRIVATE KEY for erd1q...-----`;

    const mockAddress = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';
    const mockRelayerAddress = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';

    beforeEach(() => {
        (fs.readFile as jest.Mock).mockResolvedValue(mockPem);
        (axios.post as jest.Mock).mockResolvedValue({ data: { txHash: '0xhash' } });

        (ApiNetworkProvider as jest.Mock).mockImplementation(() => ({
            getAccount: jest.fn().mockResolvedValue({ nonce: 15 })
        }));

        // Default: Clean env
        delete process.env.MULTIVERSX_RELAYER_ADDRESS;
    });

    it('should discover relayer address via /config if not provided', async () => {
        const mockSigner = {
            getAddress: () => ({ bech32: () => mockAddress }),
            sign: jest.fn().mockResolvedValue(Buffer.from('signature'))
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(UserSigner, 'fromPem').mockReturnValue(mockSigner as any);

        // Mock Config response
        (axios.get as jest.Mock).mockResolvedValueOnce({
            data: { relayerAddress: mockRelayerAddress }
        });

        await pay({
            paymentHeader: 'x402 token="EGLD" target="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu" amount="1000"',
            walletPath: 'dummy.pem',
            relayerUrl: 'http://relayer'
            // No relayerAddress provided
        });

        // Check discovery call
        expect(axios.get).toHaveBeenCalledWith(`http://relayer/relayer/address/${mockAddress}`);

        // Check transaction construction uses discovered address
        const postCall = (axios.post as jest.Mock).mock.calls[0][1];
        const tx = postCall.transaction;
        expect(tx.relayer).toBe(mockRelayerAddress);
    });

    it('should fail if relayer address cannot be discovered', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));

        const mockSigner = { getAddress: () => ({ bech32: () => mockAddress }) };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(UserSigner, 'fromPem').mockReturnValue(mockSigner as any);

        await expect(pay({
            paymentHeader: 'x402 token="EGLD" target="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu" amount="1000"',
            walletPath: 'dummy.pem',
            relayerUrl: 'http://relayer'
        })).rejects.toThrow(/Failed to discover Relayer Address/);
    });
});
