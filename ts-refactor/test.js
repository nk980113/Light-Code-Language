import { Interpreter } from './dist/';
const interpreter = await Interpreter.create('test.lcl');
interpreter.on('stateChange', (status) => {
    console.log(`目前狀態：${status}`);
});

console.log(await interpreter.run());
