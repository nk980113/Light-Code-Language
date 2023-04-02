import { DebugLogLevel } from './utils/logger.js';

export type WorkerMessage =
    | StopMessage
    | EventMessage
    | DebugMessage
    | LogMessage;

type StopMessage = {
    type: MessageType.Stop;
    data: ExecutionStopDataType;
};

type EventMessage = {
    type: MessageType.Event;
    event: Event;
}

export type ExecutionStopDataType = {
    success: true;
    // TODO: specify data type
    data: any;
} | {
    success: false;
    error: string;
};

type LogMessage = {
    type: MessageType.Log;
    content: string;
}

type DebugMessage = {
    type: MessageType.Debug;
    content: string;
    level: DebugLogLevel;
}

export enum MessageType {
    Stop = 'stop',
    Event = 'event',
    Log = 'log',
    Debug = 'debug',
}

type Event =
    | StateChangeEvent;

type StateChangeEvent = {
    name: EventType.StateChange;
    value: Status.Analyzing | Status.Running;
}

export enum Status {
    Idle = 'idle',
    Pending = 'pending',
    Analyzing = 'analyzing',
    Running = 'running',
}

export enum EventType {
    StateChange = 'stateChange',
}
