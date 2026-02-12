"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobProcessor = void 0;
const openai_1 = __importDefault(require("openai"));
const crypto = __importStar(require("crypto"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const skill_manager_1 = require("./skills/skill_manager");
class JobProcessor {
    logger = new logger_1.Logger('JobProcessor');
    openai;
    skillManager;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: config_1.CONFIG.AI.OPENAI_API_KEY,
        });
        this.skillManager = new skill_manager_1.SkillManager();
    }
    async process(job) {
        this.logger.info(`Processing job: ${job.payload}`);
        /**
         * HOW INSTRUCTIONS REACH THE AI:
         * 1. System Prompt: These are the "standing orders". The AI reads this first.
         *    It defines the identity, the rules, and the priority.
         * 2. User Message: This is the specific "Job Payload" (what the employer wants).
         *
         * The AI combines both. If the System Prompt says "Check address first",
         * the AI will do that BEFORE looking at the Payload.
         */
        const messages = [
            {
                role: 'system',
                content: `You are an autonomous MultiversX agent. Your goal is to solve the user's job using the available tools (skills).
        
        When you have completed the task, provide a final answer describing what you did and the result.
        Always conclude by submitting proof of your work using 'multiversx_prove' skill if a jobId is available.`,
            },
            {
                role: 'user',
                content: `Job Payload: ${job.payload}`,
            },
        ];
        try {
            let runCount = 0;
            const MAX_RUNS = 10;
            while (runCount < MAX_RUNS) {
                const response = await this.openai.chat.completions.create({
                    model: config_1.CONFIG.AI.MODEL,
                    messages: messages,
                    tools: this.skillManager.tools,
                    tool_choice: 'auto',
                });
                const responseMessage = response.choices[0].message;
                messages.push(responseMessage);
                if (responseMessage.content) {
                    this.logger.info(`AI reasoning: ${responseMessage.content}`);
                }
                if (responseMessage.tool_calls) {
                    for (const toolCall of responseMessage.tool_calls) {
                        const toolName = toolCall.function.name;
                        const toolArgs = JSON.parse(toolCall.function.arguments);
                        this.logger.info(`AI calling skill: ${toolName}`, toolArgs);
                        try {
                            const result = await this.skillManager.execute(toolName, toolArgs);
                            this.logger.info(`Skill ${toolName} result:`, result);
                            messages.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                name: toolName,
                                content: JSON.stringify(result),
                            });
                        }
                        catch (error) {
                            this.logger.error(`Error executing skill ${toolName}:`, error);
                            messages.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                name: toolName,
                                content: JSON.stringify({ error: error.message }),
                            });
                        }
                    }
                    runCount++;
                    continue;
                }
                // No more tool calls, return final content
                const finalContent = responseMessage.content || 'Job completed.';
                this.logger.info(`Job completed with result: ${finalContent}`);
                // Return hash of the final content as the proof result
                return crypto.createHash('sha256').update(finalContent).digest('hex');
            }
            throw new Error('Exceeded maximum number of LLM runs');
        }
        catch (error) {
            this.logger.error('Error in LLM processing:', error);
            throw error;
        }
    }
}
exports.JobProcessor = JobProcessor;
//# sourceMappingURL=processor.js.map