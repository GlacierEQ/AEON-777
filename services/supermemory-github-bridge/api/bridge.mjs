import { createApplication, handleNodeRequest } from "../src/bridge-runtime.mjs";

const application = createApplication();

export default async function bridge(req, res) {
  await handleNodeRequest(await application, req, res, { pathname: "/v1/bridge" });
}
