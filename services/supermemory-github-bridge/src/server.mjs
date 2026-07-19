import http from "node:http";
import { createApplication, handleNodeRequest } from "./bridge-runtime.mjs";

const app = await createApplication();
const port = Number.parseInt(process.env.PORT || "8080", 10);

http.createServer((req, res) => handleNodeRequest(app, req, res)).listen(port, "0.0.0.0", () => {
  process.stdout.write(`Supermemory GitHub bridge listening on ${port}\n`);
});
