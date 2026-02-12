export interface JobRequest {
    payload: string;
    isUrl?: boolean;
}
export declare class JobProcessor {
    private logger;
    private openai;
    private skillManager;
    constructor();
    process(job: JobRequest): Promise<string>;
}
