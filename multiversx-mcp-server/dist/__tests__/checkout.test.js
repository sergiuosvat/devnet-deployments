"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkout_1 = require("../logic/checkout");
// We assume the real config.json is loaded. 
// Ideally we mock the config, but for integration testing the real config is fine 
// as long as we don't rely on it changing.
// Or we can mock 'fs' to control config content.
// Let's use the real config logic but verify the BEHAVIOR differs.
describe("createPurchaseTransaction (Configurable)", () => {
    it("should use default config when marketplace is missing or default", async () => {
        const payload = await (0, checkout_1.createPurchaseTransaction)("TOK-1", 1, 1, "default");
        // Default is 'buy' function path
        expect(payload.data).toMatch(/^buy@/);
        // Expect generic placeholder address if unchanged, or whatever is in config
        // We check that it conforms to the default ABI structure
    });
    it("should use XOXNO config when marketplace='xoxno'", async () => {
        const payload = await (0, checkout_1.createPurchaseTransaction)("TOK-1", 1, 1, "xoxno");
        // XOXNO uses 'buy' (same as default currently in our code)
        // But address should be the real XOXNO address
        expect(payload.receiver).toBe("erd1lp3hkcsqcprmvm6sr7a92zcgxyl3hfyqge5zem232j9axvmnr8esrj8shs");
        expect(payload.data).toMatch(/^buy@/);
    });
    it("should use OOX config when marketplace='oox'", async () => {
        const payload = await (0, checkout_1.createPurchaseTransaction)("TOK-1", 1, 1, "oox");
        // OOX uses 'buyNft' (per our new config)
        expect(payload.data).toMatch(/^buyNft@/);
        expect(payload.receiver).toContain("erd1oox");
    });
    // New test for Case Insensitivity
    it("should be case insensitive for marketplace name", async () => {
        const payload = await (0, checkout_1.createPurchaseTransaction)("TOK-1", 1, 1, "XoXnO");
        expect(payload.receiver).toBe("erd1lp3hkcsqcprmvm6sr7a92zcgxyl3hfyqge5zem232j9axvmnr8esrj8shs");
    });
});
