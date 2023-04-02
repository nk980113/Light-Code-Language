import z from './z.js';
import chalk from 'chalk';

export enum DebugLogLevel {
    Analyze = 'analyze',
    Error = 'error',
    Exit = 'exit',
    Info = 'info',
    Warn = 'warn',
}

function noop() {}

export default class Logger {
    static prefix = chalk.blue('LCL ');
    static errorPrefix = chalk.red('ERR ');
    static makeContent(prefix: string = this.prefix, content: string | string[]) {
        const newContent = typeof content === 'string' ? content.split('\n') : content;
        return newContent.map((v) => `${prefix}${v}`).join('\n');
    }
    static levelToStrMap: { [level in DebugLogLevel]: string } = {
        [DebugLogLevel.Analyze]: chalk.blue('ANALYZE'),
        [DebugLogLevel.Error]: chalk.red('ERR'),
        [DebugLogLevel.Exit]: chalk.green('EXIT'),
        [DebugLogLevel.Info]: chalk.blue('INFO'),
        [DebugLogLevel.Warn]: chalk.yellow('WARN'),
    };

    config: OutputConfig;
    debug: (level: DebugLogLevel, content: string) => void;
    info: (content: string) => void;
    // TODO: implement the save log part

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
        if (logToConsole) {
            this.debug = function debug(level, content) {
                console.log(Logger.makeContent(`${Logger.prefix}Debug ${Logger.levelToStrMap[level]}`, content));
            }
            // TODO: check if this is for executing code
            this.info = function info(content) {
                console.log(content);
            }
        } else {
            this.debug = noop;
            this.info = noop;
        }
    }

    log: string[] = [];

    error(position: string, content: string) {
        console.error(Logger.makeContent(`${Logger.prefix}${position} ${Logger.errorPrefix}`, content));
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
