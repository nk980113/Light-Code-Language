import z from './z.js';
import chalk from 'chalk';

export default class Logger {
    static prefix = chalk.blue('LCL ');
    static errorPrefix = chalk.red('ERR ');
    static makeContent(prefix: string = this.prefix, content: string | string[]) {
        const newContent = typeof content === 'string' ? content.split('\n') : content;
        return newContent.map((v) => `${prefix}${v}`).join('\n');
    }
    
    config: OutputConfig;

    constructor({
        logToConsole,
        saveLog,
        interpreterLog,
        detailedError,
    }: OutputConfig = outputConfigValidator.parse({})) {
        this.config = {
            logToConsole,
            saveLog,
            interpreterLog,
            detailedError,
        };
    }

    log: string[] = [];

    error(position: string, content: string) {
        console.error(
            Logger.makeContent(`${Logger.prefix}${position} ${Logger.errorPrefix}`, content)
        );
        process.exit(1);
    }

    errors(position: string, content: string[]) {
        console.error(Logger.makeContent(`${Logger.prefix}${position} ${Logger.errorPrefix}`, [...content.map((v, i) => `${i} ${v}`), '由於上述錯誤，將自動退出程式']));
        process.exit(1);
    }

    runtimeError(content: string) {
        this.error('Runtime', content);
    }
}

export const outputConfigValidator = z.object({
    logToConsole: z.boolean().default(true),
    saveLog: z.boolean().default(false),
    interpreterLog: z.boolean().default(false),
    detailedError: z.boolean().default(false),
}).partial();

export type OutputConfig = z.infer<typeof outputConfigValidator>;
