import { parentPort } from 'node:worker_threads';
import { setTimeout } from 'node:timers/promises';
import { EventType, MessageType, Status, WithId, WorkerAck, WorkerMessage } from '../types.js';

let id = 0;

function getId() {
    return id++;
}

function sendMessage(message: WorkerMessage, ack: boolean = true) {
    const id = getId();
    // TODO: implement ack
    parentPort.postMessage({
        ...message,
        id,
    });
    return new Promise<void>((res) => {
        const onMessageListener = (message: WorkerAck & WithId) => {
            if (message.id === id) {
                parentPort.off('message', onMessageListener);
                res();
            }
        };
        parentPort.on('message', onMessageListener);
    });
}

async function test() {
    await sendMessage({ type: MessageType.Event, event: { name: EventType.StateChange, value: Status.Analyzing } });
    await setTimeout(3_000);
    await sendMessage({ type: MessageType.Event, event: { name: EventType.StateChange, value: Status.Running } });
    await setTimeout(3_000);
    await sendMessage({ type: MessageType.Stop, data: { success: true, data: 'Hello, world!' } });
}

test();
