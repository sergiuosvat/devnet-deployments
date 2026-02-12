import { isWhitelisted, loadWhitelist, resetWhitelistCache } from "../whitelistRegistry";
import * as fs from "fs";
import * as path from "path";

jest.mock("fs");

describe("Whitelist Registry", () => {
    const mockWhitelist = [
        "erd1qqqqqqqqqqqqqpgqfzydqrew7dr666u64q60zk98v665v7f5pccshv882p",
        "erd1k2s2lu97u2m26g0vls778m40e0qc996vcm9p3978n36r0ty6d68q3836n2"
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        resetWhitelistCache();
    });

    it("should return true for a whitelisted address", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockWhitelist));
        loadWhitelist();
        expect(isWhitelisted(mockWhitelist[0])).toBe(true);
    });

    it("should return false for a non-whitelisted address", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockWhitelist));
        loadWhitelist();
        expect(isWhitelisted("erd1qyu5wthld6u7660wnv9eax9v393z2pfs0640zvayajkn6rxt480schp6re")).toBe(false);
    });

    it("should handle empty whitelist", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));
        loadWhitelist();
        expect(isWhitelisted(mockWhitelist[0])).toBe(false);
    });

    it("should handle file not found", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        loadWhitelist();
        expect(isWhitelisted(mockWhitelist[0])).toBe(false);
    });

    it("should handle non-array JSON format", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ not: "an array" }));
        loadWhitelist();
        expect(isWhitelisted(mockWhitelist[0])).toBe(false);
    });

    it("should handle invalid JSON syntax", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue("invalid-json");
        loadWhitelist();
        expect(isWhitelisted(mockWhitelist[0])).toBe(false);
    });

    it("should initialize whitelist on first check if not manually loaded", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockWhitelist));
        // Don't call loadWhitelist() explicitly
        expect(isWhitelisted(mockWhitelist[0])).toBe(true);
    });

    it("should use cache after loading", () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockWhitelist));
        loadWhitelist();
        (fs.readFileSync as jest.Mock).mockClear();
        expect(isWhitelisted(mockWhitelist[0])).toBe(true);
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });
});
