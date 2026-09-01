import { expect, test } from 'bun:test';
import { createExplorerServer } from './server.mjs';
import { withFixture } from './test-fixture';

test("HEAD reports the corresponding GET representation length", async () => {
  await withFixture(async (root) => {
    const explorer = await createExplorerServer({ root });
    try {
      const get = await fetch(explorer.url);
      const head = await fetch(explorer.url, { method: "HEAD" });

      expect(head.headers.get("content-length")).toBe(get.headers.get("content-length"));
      expect(await head.text()).toBe("");
    } finally {
      await explorer.close();
    }
  });
});
