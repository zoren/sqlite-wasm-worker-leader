import SQLiteWorker from "./worker.js?worker";

const listener = (e) => {
  const { data } = e;
  console.log(data);
  const { type } = data;
  switch (type) {
    case "error": {
      const { errorMessage } = data;
      console.error("Error from worker", errorMessage);
      break;
    }
    default: {
      console.warn("Unhandled message from worker", data);
    }
  }
};

export const openSimulateError = (worker) => {
  worker.postMessage({ type: "open", simulateError: true });
};

export const initWorker = () => new Promise((resolve, reject) => {
  const worker = new SQLiteWorker();

  const initListener = ({ data }) => {
    if (data.type !== "ready")
      reject(new Error("Expected first message to be ready message"));
    worker.removeEventListener("message", initListener);
    console.log("worker ready SQLite version", data.version);
    worker.addEventListener("message", listener);
    resolve(worker);
  };
  worker.addEventListener("message", initListener);
});
