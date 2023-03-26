import { parentPort } from 'worker_threads';
import { EventType, MessageType, Status, WorkerMessage } from '../types.js';
import { setTimeout } from 'timers/promises';

function sendMessage(message: WorkerMessage) {
    // TODO: implement ack
    parentPort.postMessage(message);
}

async function test() {
    sendMessage({ type: MessageType.Event, event: { name: EventType.StateChange, value: Status.Compiling } });
    await setTimeout(3_000);
    sendMessage({ type: MessageType.Event, event: { name: EventType.StateChange, value: Status.Running } });
    await setTimeout(3_000);
    sendMessage({ type: MessageType.Stop, data: { success: true, data: 'Hello, world!' } });
}

test();
