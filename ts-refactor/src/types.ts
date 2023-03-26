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
    level: string;
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
    value: Status.Compiling | Status.Running;
}

export enum Status {
    Idle = 'idle',
    Pending = 'pending',
    Compiling = 'compiling',
    Running = 'running',
}

export enum EventType {
    StateChange = 'stateChange',
}
