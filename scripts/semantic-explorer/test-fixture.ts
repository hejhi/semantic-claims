import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const FIXTURE_FILES = {
  'src/orders.invariants.md': `# Order Invariants

## §1 Publication

### §1.1 Completed orders remain visible

The completed order remains visible while its receipt is prepared.
`,
  'src/orders.invariants.test.ts': `describe('§1 — Publication', () => {
  test('§1.1 — Completed orders remain visible', () => {});
  test('§1.1 — Completed orders remain visible', () => {});
});
`,
  'src/orders.scenarios.md': `# Order Scenarios

## §1 Cancellation

### §1.1 Cancellation precedes reimbursement

After an order is cancelled, reimbursement begins before its receipt is archived.
`,
  'src/orders.scenarios.test.mjs': `describe('§1 — Cancellation', () => {
  test('§1.1 — Cancellation precedes reimbursement', () => {});
});
`,
  'src/--checkout.scenarios.md': `# Checkout Seam Scenarios

## §1 Submission

### §1.7 Accepted payment reaches order creation

An accepted payment reaches order creation exactly once. Rare semantic phrase.
`,
  'src/--checkout.scenarios.test.js': `describe('§1 — Submission', () => {
  test('§1.7 — Accepted payment reaches order creation', () => {});
});
`,
  'src/temp/returns.invariants.md': `# Return Invariants

## §1 Visibility

### §1.1 Accepted returns remain visible

An accepted return remains visible until its resolution is recorded.
`,
  'src/temp/returns.invariants.test.mjs': `describe('§1 — Visibility', () => {
  test('§1.1 — Accepted returns remain visible', () => {});
});
`,
};

export async function writeFixture(): Promise<string> {
  const root = await mkdtemp(
    path.join(tmpdir(), 'semantic-claims-explorer-'),
  );
  for (const [relativePath, contents] of Object.entries(FIXTURE_FILES)) {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }
  return root;
}

export async function withFixture<T>(
  run: (root: string) => Promise<T>,
): Promise<T> {
  const root = await writeFixture();
  try {
    return await run(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

export async function repositorySnapshot(
  root: string,
): Promise<Record<string, string>> {
  const snapshot: Record<string, string> = {};

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(filePath);
      } else {
        snapshot[path.relative(root, filePath)] = await readFile(
          filePath,
          'utf8',
        );
      }
    }
  }

  await visit(root);
  return snapshot;
}

export async function readFirstLine(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (!output.includes('\n')) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  await reader.cancel();
  return output.split(/\r?\n/, 1)[0] ?? '';
}
