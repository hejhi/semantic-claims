import { describe, expect, test } from 'bun:test';
import { createExplorerServer } from './server.mjs';
import { repositorySnapshot, withExplore, withFixture } from './test-fixture';

describe('§1 — Local read-only operation', () => {
  test('§1.2 — Exploring leaves the repository unchanged', async () => {
    await withFixture(async (root) => {
      const before = await repositorySnapshot(root);
      const explorer = await createExplorerServer({ root });
      try {
        await fetch(explorer.url).then((response) => response.text());
        await fetch(`${explorer.url}?ownership=seam`).then((response) =>
          response.text(),
        );
        await fetch(
          `${explorer.url}source?path=${encodeURIComponent('src/orders.invariants.md')}&line=5`,
        ).then((response) => response.text());
      } finally {
        await explorer.close();
      }
      expect(await repositorySnapshot(root)).toEqual(before);
    });
  });

  test('§1.3 — The explorer prints its local URL', async () => {
    await withExplore(async (firstLine) => {
      expect(firstLine).toMatch(
        /^Semantic Explorer: http:\/\/127\.0\.0\.1:\d+\/$/,
      );
    });
  });
});
