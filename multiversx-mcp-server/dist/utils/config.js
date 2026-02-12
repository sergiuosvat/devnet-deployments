"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load config once at module level
const configPath = path_1.default.join(__dirname, "../../src/config.json");
const rawConfig = fs_1.default.readFileSync(configPath, "utf-8");
exports.config = JSON.parse(rawConfig);
exports.default = exports.config;
