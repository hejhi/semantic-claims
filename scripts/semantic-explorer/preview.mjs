import { rm } from "node:fs/promises";
import { writeMockRepository } from "./mock-data.mjs";
import { createExplorerServer } from "./server.mjs";

const root = await writeMockRepository();
let explorer;

try {
  explorer = await createExplorerServer({ root });
} catch (error) {
  await rm(root, { force: true, recursive: true });
  throw error;
}

console.log(`Semantic Explorer preview: ${explorer.url}`);

let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await explorer.close();
  await rm(root, { force: true, recursive: true });
}

process.once("SIGINT", () => void close());
process.once("SIGTERM", () => void close());
