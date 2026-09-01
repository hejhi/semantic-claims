import { describe, expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { createExplorerServer } from './server.mjs';
import {
  readFirstLine,
  repositorySnapshot,
  withFixture,
} from './test-fixture';

const CLI = fileURLToPath(
  new URL('../check-semantics.mjs', import.meta.url),
);

describe('§1 — Local read-only operation', () => {
  test('§1.1 — The explorer is served only through the local loopback interface', async () => {
    await withFixture(async (root) => {
      const child = Bun.spawn({
        cmd: [process.execPath, CLI, 'explore'],
        cwd: root,
        stderr: 'pipe',
        stdout: 'pipe',
      });

      try {
        const firstLine = await readFirstLine(child.stdout);
        expect(firstLine).toMatch(
          /^Semantic Explorer: http:\/\/127\.0\.0\.1:\d+\/$/,
        );
        const url = firstLine.replace('Semantic Explorer: ', '');
        expect(new URL(url).hostname).toBe('127.0.0.1');
        expect(await fetch(url).then((response) => response.status)).toBe(200);
      } finally {
        child.kill();
        await child.exited;
      }
    });
  });

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
});
