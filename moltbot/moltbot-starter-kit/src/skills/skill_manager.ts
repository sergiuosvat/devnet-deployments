import * as skills from 'multiversx-openclaw-skills';
import { Logger } from '../utils/logger';
import { MarkdownSkillLoader } from './markdown_skill_loader';
import * as path from 'path';
import * as fs from 'fs';

export class SkillManager {
    private logger = new Logger('SkillManager');
    public readonly tools: any[];

    constructor() {
        // Find SKILL.md - it could be in different locations depending on how the bot is run
        // 1. Dev mode: src/skills/skill_manager.ts -> ../../../ (molt/)
        // 2. Build mode: build/src/skills/skill_manager.js -> ../../../../ (molt/)
        // 3. From project root: node_modules/multiversx-openclaw-skills/SKILL.md

        const possiblePaths = [
            path.resolve(__dirname, '../../../multiversx-openclaw-skills/SKILL.md'),
            path.resolve(__dirname, '../../../../multiversx-openclaw-skills/SKILL.md'),
            path.resolve(process.cwd(), 'node_modules/multiversx-openclaw-skills/SKILL.md'),
            path.resolve(process.cwd(), '../multiversx-openclaw-skills/SKILL.md')
        ];

        let skillPath = possiblePaths[0];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                skillPath = p;
                break;
            }
        }

        this.logger.info(`Loading skills from: ${skillPath}`);
        this.tools = MarkdownSkillLoader.loadFromMarkdown(skillPath);
        this.logger.info(`Loaded ${this.tools.length} tools from SKILL.md`);
    }

    async execute(toolName: string, args: any): Promise<any> {
        this.logger.info(`Executing skill: ${toolName} with args: ${JSON.stringify(args)}`);

        // Map multiversx_query -> query
        const normalizedName = toolName.replace(/:/g, '_');
        const skillFunc = normalizedName.startsWith('multiversx_')
            ? normalizedName.split('_')[1]
            : normalizedName;

        if (typeof (skills as any)[skillFunc] === 'function') {
            return await (skills as any)[skillFunc](args);
        }

        throw new Error(`Unknown skill: ${toolName} (mapped to ${skillFunc})`);
    }
}
