"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tracking_1 = require("../logic/tracking");
const axios_1 = __importDefault(require("axios"));
jest.mock("axios");
const mockedAxios = axios_1.default;
describe("trackOrder", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should return pending for 'pending' status", async () => {
        mockedAxios.get.mockResolvedValue({ data: { status: "pending" } });
        const result = await (0, tracking_1.trackOrder)("tx-123");
        expect(result.status).toBe("pending");
        expect(result.retry_after).toBe(5);
    });
    it("should return success for 'success' status", async () => {
        mockedAxios.get.mockResolvedValue({ data: { status: "success" } });
        const result = await (0, tracking_1.trackOrder)("tx-123");
        expect(result.status).toBe("success");
        expect(result.details).toContain("successfully");
    });
    it("should return failed for 'fail' status including logic", async () => {
        mockedAxios.get.mockResolvedValue({
            data: {
                status: "fail",
                operations: [{ message: "Out of gas" }]
            }
        });
        const result = await (0, tracking_1.trackOrder)("tx-123");
        expect(result.status).toBe("failed");
        expect(result.details).toContain("Out of gas");
    });
    it("should handle 404 as pending (propagation delay)", async () => {
        const error = new Error("Not Found");
        error.isAxiosError = true;
        error.response = { status: 404 };
        axios_1.default.isAxiosError.mockReturnValue(true);
        mockedAxios.get.mockRejectedValue(error);
        const result = await (0, tracking_1.trackOrder)("tx-not-found");
        expect(result.status).toBe("pending");
        expect(result.details).toContain("Propagation Delay");
        expect(result.retry_after).toBe(5);
    });
    it("should handle generic API errors", async () => {
        const error = new Error("Network Error");
        axios_1.default.isAxiosError.mockReturnValue(false); // or true but different status
        mockedAxios.get.mockRejectedValue(error);
        const result = await (0, tracking_1.trackOrder)("tx-error");
        expect(result.status).toBe("unknown");
        expect(result.details).toContain("Network Error");
    });
    it("should return unknown if no hash provided", async () => {
        const result = await (0, tracking_1.trackOrder)("");
        expect(result.status).toBe("unknown");
    });
});
