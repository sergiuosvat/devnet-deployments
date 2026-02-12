import OpenAI from 'openai';
import * as crypto from 'crypto';
import { CONFIG } from './config';
import { Logger } from './utils/logger';
import { SkillManager } from './skills/skill_manager';

export interface JobRequest {
  payload: string;
  isUrl?: boolean;
}

export class JobProcessor {
  private logger = new Logger('JobProcessor');
  private openai: OpenAI;
  private skillManager: SkillManager;

  constructor() {
    this.openai = new OpenAI({
      apiKey: CONFIG.AI.OPENAI_API_KEY,
    });
    this.skillManager = new SkillManager();
  }

  async process(job: JobRequest): Promise<string> {
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
    const messages: any[] = [
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
          model: CONFIG.AI.MODEL,
          messages: messages,
          tools: this.skillManager.tools as any,
          tool_choice: 'auto',
        });

        const responseMessage = response.choices[0].message;
        messages.push(responseMessage);

        if (responseMessage.content) {
          this.logger.info(`AI reasoning: ${responseMessage.content}`);
        }

        if (responseMessage.tool_calls) {
          for (const toolCall of responseMessage.tool_calls as any[]) {
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
            } catch (error) {
              this.logger.error(`Error executing skill ${toolName}:`, error);
              messages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: toolName,
                content: JSON.stringify({ error: (error as Error).message }),
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
    } catch (error) {
      this.logger.error('Error in LLM processing:', error);
      throw error;
    }
  }
}
