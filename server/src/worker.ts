import { startExecutionWorker } from "./workers/executionWorker";

void startExecutionWorker()
  .then((worker) => {
    const shutdown = () => {
      void worker.close().then(() => process.exit(0));
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  })
  .catch(() => {
    console.error("[worker] Could not start execution worker.");
    process.exit(1);
  });
