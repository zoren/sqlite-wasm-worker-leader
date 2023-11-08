import { initWorker, openSimulateError } from "./leader.js";

const worker1 = await initWorker();
// const worker2 = await initWorker();

openSimulateError(worker1);
