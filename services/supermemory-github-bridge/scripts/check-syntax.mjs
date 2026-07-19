import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify((command, args, callback) => {
  const child = spawn(command, args, { stdio: "inherit" });
  child.on("error", callback);
  child.on("exit", (code) => callback(code === 0 ? null : new Error(`${command} exited ${code}`)));
});

async function filesIn(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const nested = await Promise.all(entries.map(async (entry) => {
    const location = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesIn(location) : (entry.name.endsWith(".mjs") ? [location] : []);
  }));
  return nested.flat();
}

const files = [...await filesIn("src"), ...await filesIn("api"), ...await filesIn("test"), ...await filesIn("scripts")];
for (const file of files) {
  await exec(process.execPath, ["--check", file]);
}
