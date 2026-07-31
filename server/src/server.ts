import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 FlowPilot API running on http://localhost:${env.port} [${env.nodeEnv}]`);
});
