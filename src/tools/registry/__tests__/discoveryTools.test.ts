import { searchAgents } from "../searchAgents";
import { getTopRatedAgents } from "../getTopRatedAgents";
import { createNetworkProvider } from "../../networkConfig";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../networkConfig", () => ({
    loadNetworkConfig: jest.fn().mockReturnValue({ apiUrl: "https://api.testnet.multiversx.com", chainId: "T" }),
    createNetworkProvider: jest.fn().mockReturnValue({
        doGetGeneric: jest.fn(),
    })
}));

describe("Discovery Tools", () => {
    const mockApi = createNetworkProvider({} as any);

    describe("search-agents", () => {
        it("should return agents matching the query", async () => {
            const mockNfts = [
                {
                    identifier: "AGENT-1",
                    name: "DeFi Bot",
                    nonce: 1,
                    owner: "erd1...",
                    url: "ipfs://...",
                    collection: "AGENTS",
                    timestamp: 123456
                }
            ];
            mockedAxios.get.mockResolvedValue({ data: mockNfts });

            const result = await searchAgents("DeFi");
            const agents = JSON.parse(result.content[0].text);

            expect(agents).toHaveLength(1);
            expect(agents[0].name).toBe("DeFi Bot");
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("/nfts"), expect.any(Object));
        });

        it("should return no agents found message if no matches", async () => {
            mockedAxios.get.mockResolvedValue({ data: [] });
            const result = await searchAgents("NonExistent");
            expect(result.content[0].text).toContain('No agents found matching query');
        });

        it("should filter by minTrust", async () => {
            const mockNfts = [
                { identifier: "A1", name: "High Trust", nonce: 1 },
                { identifier: "A2", name: "Low Trust", nonce: 2 }
            ];
            mockedAxios.get.mockResolvedValue({ data: mockNfts });

            // Note: Our current searchAgents mocks reputation at 85.0
            const result = await searchAgents("query", 90);
            expect(result.content[0].text).toContain('No agents found');
        });

        it("should handle API errors", async () => {
            mockedAxios.get.mockRejectedValue(new Error("API Down"));
            const result = await searchAgents("test");
            expect(result.content[0].text).toContain("Error searching for agents: API Down");
        });
    });

    describe("get-top-rated-agents", () => {
        it("should return sorted agents by reputation", async () => {
            const mockNfts = [
                { identifier: "A1", name: "Agent 1", nonce: 1, url: "u1" },
                { identifier: "A2", name: "Agent 2", nonce: 2, url: "u2" }
            ];
            (mockApi.doGetGeneric as jest.Mock).mockImplementation((url: string) => {
                if (url.includes("nfts")) return Promise.resolve(mockNfts);
                if (url.includes("vm-values/reputationScore?args=1")) {
                    return Promise.resolve({ data: { data: { returnData: [Buffer.from([0x23, 0x28]).toString("base64")] } } }); // 9000
                }
                if (url.includes("vm-values/reputationScore?args=2")) {
                    return Promise.resolve({ data: { data: { returnData: [Buffer.from([0x27, 0x10]).toString("base64")] } } }); // 10000
                }
                return Promise.resolve(null);
            });

            const result = await getTopRatedAgents("all", 2);
            const top = JSON.parse(result.content[0].text);

            expect(top[0].name).toBe("Agent 2"); // Higher score
            expect(top[0].reputation_score).toBe(10000);
            expect(top[1].name).toBe("Agent 1");
        });

        it("should handle empty results", async () => {
            (mockApi.doGetGeneric as jest.Mock).mockResolvedValue([]);
            const result = await getTopRatedAgents("all");
            expect(result.content[0].text).toBe("[]");
        });

        it("should handle error in reputation fetch for some agents", async () => {
            const mockNfts = [{ identifier: "A1", name: "Agent 1", nonce: 1, url: "u1" }];
            (mockApi.doGetGeneric as jest.Mock).mockImplementation((url: string) => {
                if (url.includes("nfts")) return Promise.resolve(mockNfts);
                throw new Error("VM Error");
            });

            const result = await getTopRatedAgents("all");
            expect(result.content[0].text).toBe("[]");
        });

        it("should handle global API failure", async () => {
            (mockApi.doGetGeneric as jest.Mock).mockRejectedValue(new Error("Network Error"));
            const result = await getTopRatedAgents("all");
            expect(result.content[0].text).toContain("Error fetching top rated agents: Network Error");
        });
    });
});
