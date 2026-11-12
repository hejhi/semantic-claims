import { describe, expect, test } from 'bun:test';
import { networkInterfaces } from 'node:os';
import { withExplore } from './test-fixture';

describe('§1 — Local read-only operation', () => {
  test('§1.1 — The running explorer refuses connections from other machines', async () => {
    // A connection from another machine arrives at a network address other than loopback.
    const networkAddress = Object.values(networkInterfaces())
      .flat()
      .find((entry) => entry?.family === 'IPv4' && !entry.internal)?.address;
    if (!networkAddress) {
      throw new Error('This proof requires an IPv4 network address other than loopback.');
    }
    await withExplore(async (firstLine) => {
      const url = new URL(firstLine.replace('Semantic Explorer: ', ''));
      url.hostname = networkAddress;
      await expect(fetch(url)).rejects.toThrow();
    });
  });
});
