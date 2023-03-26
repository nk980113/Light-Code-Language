import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { inspect } from 'node:util';
import EventEmitter from 'node:events';
import TypedEmitterNamespace from 'typed-emitter';
import autoBind from 'auto-bind';
import { outputConfigValidator, OutputConfig } from '../utils/logger.js';
import z, { wrapZodError } from '../utils/z.js';
import Logger from '../utils/logger.js';
import randomId from '../utils/random.js';

type TypedEmitter<T extends TypedEmitterNamespace.EventMap> = TypedEmitterNamespace.default<T>

class Interpreter {
    static async create(filePath: string, config: InterpreterConfig) {
        const { id, instance } = await InternalInterpreter.create(filePath, config);
        return new Interpreter(id, instance);
    }

    readonly id: string;

    private constructor(id: string, private instance: InternalInterpreter) {
        Object.defineProperty(this, 'id', {
            value: id,
            writable: false,
            configurable: false,
        });
    }
}

type InternalInterpreterEventsMap = {
    stateChange(status: Status): void;
}

class InternalInterpreter {
    private static instances: {
        [id: string]: InternalInterpreter;
    } = {};

    listener: TypedEmitter<InternalInterpreterEventsMap>;
    state: InternalInterpreterState;

    static async create(filePath: string, config: InterpreterConfig): Promise<{ id: string; instance: InternalInterpreter; }> {
        const parseConfigResult = wrapZodError(configValidator, config, 'config');
        
        if (!parseConfigResult.success) {
            // @ts-ignore
            Logger.prototype.errors('Interpreter Create', parseConfigResult.errors);
        }

        // @ts-ignore
        const logger = new Logger(parseConfigResult.data);

        try {
            if (!(await stat(filePath)).isFile()) {
                throw new Error(`找不到檔案 ${filePath}`);
            }

            if (extname(filePath) !== '.lcl') {
                throw new Error('文件的副檔名必須為 .lcl');
            }
        } catch (err) {
            logger.error('Interpreter Create', inspect(err));
        }

        const content = await readFile(filePath, { encoding: 'utf-8' });
        const instance = new InternalInterpreter(filePath, content);
        const id = randomId(5, Object.keys(this.instances))
        return { id, instance };
    }

    private constructor(public filePath: string, public content: string) {
        this.listener = new EventEmitter() as TypedEmitter<InternalInterpreterEventsMap>;
        this.state = { status: Status.Idle };

        autoBind(this);
    }
}

enum Status {
    Idle = 'idle',
    Compiling = 'compiling',
    Running = 'running',
}

type InternalInterpreterState =
    | IdleState;

type IdleState = {
    status: Status.Idle,
};

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

type InterpreterConfig = z.infer<typeof configValidator>;
