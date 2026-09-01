import { rm } from "node:fs/promises";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { buildExplorerModel } from "./model.mjs";
import { writeMockRepository } from "./mock-data.mjs";
import { createExplorerServer } from "./server.mjs";

let root: string;

beforeAll(async () => {
  root = await writeMockRepository();
});

afterAll(async () => {
  await rm(root, { force: true, recursive: true });
});

test("the preview contains varied subjects, claims, and source pages", async () => {
  const model = await buildExplorerModel(root);
  expect(model.subjects).toHaveLength(10);
  expect(model.claims.length).toBeGreaterThan(20);
  expect(model.claims.some(({ seam }) => seam)).toBe(true);
  const proofRichClaim = model.claims.reduce((current, claim) =>
    claim.proofs.length > current.proofs.length ? claim : current,
  );
  expect(proofRichClaim.proofs.length).toBeGreaterThan(10);

  const explorer = await createExplorerServer({ root });
  try {
    const page = await fetch(explorer.url).then((response) => response.text());
    expect(page).toContain("Remote document reconciliation");

    const detail = await fetch(
      `${explorer.url}?claim=${encodeURIComponent(proofRichClaim.key)}`,
    ).then((response) => response.text());
    expect(detail.match(/<a class="file-link"/g)?.length).toBe(proofRichClaim.proofs.length + 1);

    const claim = model.claims[0]!;
    const source = await fetch(
      `${explorer.url}source?path=${encodeURIComponent(claim.claimDocument.path)}&line=${claim.claimDocument.line}`,
    );
    expect(source.status).toBe(200);
  } finally {
    await explorer.close();
  }
});
