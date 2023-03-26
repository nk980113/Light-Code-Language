const letters = 'ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz12345678901234567890';

function randomIntInRange(min: number, max: number) {
    return Math.floor(Math.random() * max) + min;
}

function notExclusiveRandomId(length: number) {
    return ' '.repeat(length).split('').map(() => letters[randomIntInRange(0, letters.length)]).join();
}

export default function randomId(length: number, excludeFrom: string[]) {
    let returnVal: string;
    do {
        returnVal = notExclusiveRandomId(length);
    } while (excludeFrom.includes(returnVal));
    return returnVal;
}
