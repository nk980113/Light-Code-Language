import { readFile, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import { Worker } from 'node:worker_threads';
import EventEmitter from 'node:events';
import type TypedEmitterNamespace from 'typed-emitter';
import autoBind from 'auto-bind';
import { EventType, MessageType, Status, WorkerMessage } from '../types.js';
import { outputConfigValidator } from '../utils/logger.js';
import z, { wrapZodError } from '../utils/z.js';
import Logger from '../utils/logger.js';
import randomId from '../utils/random.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type TypedEmitter<T extends TypedEmitterNamespace.EventMap> = TypedEmitterNamespace.default<T>

export class Interpreter {
    static async create(mainFilePath: string, config: InterpreterConfig = {}) {
        const { id, instance } = await InternalInterpreter.create(mainFilePath, config);
        return new Interpreter(id, instance);
    }

    readonly id: string;
    run: () => Promise<unknown>;

    private constructor(id: string, private instance: InternalInterpreter) {
        Object.defineProperty(this, 'id', {
            value: id,
            writable: false,
            configurable: false,
        });
        this.run = this.instance.run;
    }

    on<T extends EventType>(event: T, listener: InternalInterpreterEventsMap[T]) {
        this.instance.listener.on(event, listener);
    }
}

type InternalInterpreterEventsMap = {
    [EventType.StateChange](status: Status): void;
}

class InternalInterpreter {
    private static instances: {
        [id: string]: InternalInterpreter;
    } = {};

    listener: TypedEmitter<InternalInterpreterEventsMap>;
    state: InternalInterpreterState;

    static async create(mainFilePath: string, config: InterpreterConfig): Promise<{ id: string; instance: InternalInterpreter; }> {
        const parseConfigResult = wrapZodError(configValidator, config, 'config');
        
        if (!parseConfigResult.success) {
            // @ts-ignore
            Logger.prototype.errors('Interpreter Create', parseConfigResult.errors);
        }

        // @ts-ignore
        const logger = new Logger(parseConfigResult.data);

        try {
            let fileStat: Stats;
            try {
                fileStat = await stat(mainFilePath);
            } catch (e) {
                throw new Error(`找不到檔案 ${mainFilePath}`, { cause: e });
            }
            if (!fileStat.isFile()) {
                throw new Error(`找不到檔案 ${mainFilePath}`);
            }

            if (extname(mainFilePath) !== '.lcl') {
                throw new Error('文件的副檔名必須為 .lcl');
            }
        } catch (err) {
            logger.error('Interpreter Create', inspect(err));
        }

        const content = await readFile(mainFilePath, { encoding: 'utf-8' });
        const instance = new InternalInterpreter(mainFilePath, content, config, logger);
        const id = randomId(5, Object.keys(this.instances))
        return { id, instance };
    }

    private constructor(
        public mainFilePath: string,
        public content: string,
        public config: InterpreterConfig,
        public logger: Logger,
    ) {
        this.listener = new EventEmitter() as TypedEmitter<InternalInterpreterEventsMap>;
        this.state = { status: Status.Idle };

        autoBind(this);
    }

    run() {
        return new Promise((res, rej) => {
            if (this.state.status !== Status.Idle) {
                return rej(`無法執行狀態不為idle的執行器(狀態：${this.state.status})`);
            }

            // TODO: translate the size part

            this.state = {
                status: Status.Pending,
                onComplete: (result) => {
                    if (!result.success) {
                        this.logger.runtimeError('執行時出現錯誤');
                        // @ts-ignore
                        this.logger.runtimeError(result.error);
                        // @ts-ignore
                        rej(result.error);
                    } else {
                        res(result.data);
                    }
                },
                worker: new Worker(join(__dirname, 'worker.js'), { workerData: {} }).on('message', this.listenMessage),
            }
        });
    }

    private listenMessage(message: WorkerMessage) {
        switch (message.type) {
            case MessageType.Stop: {
                (this.state as NonIdleState).onComplete(message.data);
                this.state = { status: Status.Idle };
                break;
            }
            case MessageType.Event: {
                const { event } = message;
                switch (event.name) {
                    case EventType.StateChange: {
                        this.state = {
                            ...(this.state as NonIdleState),
                            status: event.value,
                        };
                        this.listener.emit(EventType.StateChange, event.value);
                    }
                }
                break;
            }
            case MessageType.Debug: {
                this.logger.debug(message.level, message.content)
                break;
            }
            case MessageType.Log: {
                this.logger.info(message.content);
            }
        }
    }
}



type InternalInterpreterState =
    | IdleState
    | NonIdleState;

type IdleState = {
    status: Status.Idle;
};

type NonIdleState = {
    status: Exclude<Status, Status.Idle>;
    onComplete(result: {
        success: true;
        data: any;
    } | {
        success: false;
        error: string;
    }): void;
    worker: Worker;
}

const performanceConfigValidator = z.object({
    chunkPerExecution: z.number().positive().finite().default(100),
    interval: z.number().nonnegative().default(1),
    maxChunks: z.number().default(Infinity),
    maxCallLength: z.number().positive().default(100),
    maxVMem: z.number().nonnegative().default(Infinity),
}).partial();



const fsConfigValidator = z.object({
    fsRoot: z.string().default(''),
}).partial();

const configValidator = performanceConfigValidator.merge(outputConfigValidator).merge(fsConfigValidator);

export type InterpreterConfig = z.infer<typeof configValidator>;
export { Status };
