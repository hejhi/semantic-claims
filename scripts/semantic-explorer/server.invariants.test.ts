import { describe, expect, test } from 'bun:test';
import { withExplore } from './test-fixture';

describe('§1 — Local read-only operation', () => {
  test('§1.1 — The running explorer accepts local connections exclusively', async () => {
    await withExplore(async (firstLine) => {
      const url = firstLine.replace('Semantic Explorer: ', '');
      expect(new URL(url).hostname).toBe('127.0.0.1');
      expect(await fetch(url).then((response) => response.status)).toBe(200);
    });
  });
});
