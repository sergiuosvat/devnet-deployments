"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feedValidator_1 = require("../utils/feedValidator");
describe("Feed Validator", () => {
    it("should return valid for a correct feed", () => {
        const items = [{
                id: "1",
                title: "Test",
                description: "Desc",
                link: "http://link",
                image_link: "http://image",
                availability: "in_stock",
                price: { value: "100", currency: "EGLD" }
            }];
        const result = (0, feedValidator_1.validateFeed)(items);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it("should return error if root is not an array", () => {
        const result = (0, feedValidator_1.validateFeed)({});
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain("must be an array");
    });
    it("should accumulate errors for missing fields", () => {
        const items = [
            {
                // Missing ID
                title: "Test",
                // Missing desc, link, image, avail
            }
        ];
        const result = (0, feedValidator_1.validateFeed)(items);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Item 0: Missing 'id'");
        expect(result.errors).toContain("Item 0: Missing 'description'");
        expect(result.errors).toContain("Item 0: Missing 'link'");
        expect(result.errors).toContain("Item 0: Missing 'image_link'");
        expect(result.errors).toContain("Item 0: Missing 'availability'");
        expect(result.errors).toContain("Item 0: Missing 'price' object");
    });
    it("should error if price sub-fields are missing", () => {
        const items = [{
                id: "1",
                title: "Test",
                description: "Desc",
                link: "Link",
                image_link: "Img",
                availability: "in_stock",
                price: {} // Empty price
            }];
        const result = (0, feedValidator_1.validateFeed)(items);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Item 0: Missing 'price.value'");
        expect(result.errors).toContain("Item 0: Missing 'price.currency'");
    });
});
