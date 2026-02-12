import * as fs from 'fs';

export interface SkillTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required: string[];
        };
    };
}

export class MarkdownSkillLoader {
    public static loadFromMarkdown(filePath: string): SkillTool[] {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Skill file not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const tools: SkillTool[] = [];

        // Simple regex-based parsing for SKILL.md format
        const skillSections = content.split(/### [0-9]+\. /).slice(1);

        for (const section of skillSections) {
            const nameMatch = section.match(/`([^`]+)`/);
            const descMatch = section.match(/\*\*Description\*\*:\s*([^\n]+)/);

            if (nameMatch && descMatch) {
                // Sanitize name for OpenAI (colons to underscores)
                const rawName = nameMatch[1];
                const name = rawName.replace(/:/g, '_');
                const description = descMatch[1].trim();

                const properties: Record<string, any> = {};
                const required: string[] = [];

                // Parse inputs
                const inputSection = section.split(/\*\*Input\*\*:/)[1]?.split(/\*\*Usage\*\*:/)[0];
                if (inputSection) {
                    const lines = inputSection.split('\n');
                    for (const line of lines) {
                        const paramMatch = line.match(/^\s*-\s*`([^`]+)`:\s*(\w+)(?:\s*\(([^)]+)\))?/);
                        if (paramMatch) {
                            const paramName = paramMatch[1];
                            const paramType = paramMatch[2];
                            const paramDesc = paramMatch[3] || '';

                            properties[paramName] = {
                                type: this.mapType(paramType),
                                description: paramDesc,
                            };

                            // Assume all listed are required for now, or look for "(optional)"
                            if (!paramDesc.toLowerCase().includes('optional')) {
                                required.push(paramName);
                            }
                        }
                    }
                }

                tools.push({
                    type: 'function',
                    function: {
                        name,
                        description,
                        parameters: {
                            type: 'object',
                            properties,
                            required,
                        },
                    },
                });
            }
        }

        return tools;
    }

    private static mapType(type: string): string {
        switch (type.toLowerCase()) {
            case 'string': return 'string';
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'object': return 'object';
            case 'array': return 'array';
            case 'json': return 'object';
            default: return 'string';
        }
    }
}
