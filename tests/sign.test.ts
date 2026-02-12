import { sign } from '../src/sign';
import { UserSigner } from '@multiversx/sdk-wallet';
import { promises as fs } from 'fs';

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));

describe('MultiversX Sign Skill', () => {
    const mockPem = `-----BEGIN PRIVATE KEY for erd1q...-----
MOCK_PEM_CONTENT
-----END PRIVATE KEY for erd1q...-----`;

    // Address corresponding to a dummy key, but here we mock signer so we need matching address.
    const sender = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';

    beforeEach(() => {
        (fs.readFile as jest.Mock).mockResolvedValue(mockPem);
    });

    it('should sign a valid transaction object', async () => {
        const mockSigner = {
            getAddress: () => ({ bech32: () => sender }),
            sign: jest.fn().mockResolvedValue(Buffer.from('signature'))
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(UserSigner, 'fromPem').mockReturnValue(mockSigner as any);

        const txInput = {
            nonce: 10,
            value: "100",
            receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
            gasLimit: 50000,
            gasPrice: 1000000000,
            data: Buffer.from("hello").toString('base64'), // Plain object usually has base64 data
            sender: sender,
            chainID: "D",
            version: 1,
            options: 0
        };

        const result = await sign({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transaction: txInput as any,
            walletPath: 'dummy.pem'
        });

        // Result should be a plain object with signature
        expect(result.signature).toBeDefined();
        // Since we mocked sign to return 'signature' buffer, typically it's hex encoded in result
        expect(result.signature).toBe(Buffer.from('signature').toString('hex'));
    });

    it('should fail if sender does not match wallet', async () => {
        const mockSigner = {
            getAddress: () => ({ bech32: () => sender }),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(UserSigner, 'fromPem').mockReturnValue(mockSigner as any);

        const txInput = {
            sender: 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th', // Mismatch
            nonce: 10,
            value: "100",
            receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
            gasLimit: 50000,
            gasPrice: 1000000000,
            chainID: "D",
            version: 1,
            options: 0
        };

        await expect(sign({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transaction: txInput as any,
            walletPath: 'dummy.pem'
        })).rejects.toThrow(/does not match/);
    });
});
