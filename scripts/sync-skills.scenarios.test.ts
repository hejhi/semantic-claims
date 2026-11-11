import { describe, expect, test } from 'bun:test';
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
import { fileURLToPath } from 'node:url';

const SYNCHRONIZER = fileURLToPath(
  new URL('./sync-skills.mjs', import.meta.url),
);

async function writeFixture(
  files: Record<string, string>,
): Promise<string> {
  const root = await mkdtemp(
    path.join(tmpdir(), 'semantic-claims-sync-'),
  );

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }

  return root;
}

async function runSynchronizer(
  files: Record<string, string>,
): Promise<{ root: string; stderr: string; stdout: string }> {
  const root = await writeFixture(files);
  const child = Bun.spawn({
    cmd: [process.execPath, SYNCHRONIZER],
    cwd: root,
    stderr: 'pipe',
    stdout: 'pipe',
  });
  const [exitCode, stderr, stdout] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
    new Response(child.stdout).text(),
  ]);

  if (exitCode !== 0) {
    await rm(root, { force: true, recursive: true });
    throw new Error(`Skill synchronization failed:\n${stderr}`);
  }

  return { root, stderr, stdout };
}

const SKILL = '.agents/skills/semantic-claims';
const MARKER =
  '<!-- Generated from REFERENCE.md by "bun run sync:skills". Edit REFERENCE.md instead of the text below. -->';
const BLOB = 'https://github.com/hejhi/semantic-claims/blob/main';
const skillHead = `---\nname: semantic-claims\n---\n\nskill text\n\n${MARKER}`;

const sourceFiles = {
  'REFERENCE.md':
    '# Reference\n\n[readme](./README.md) [subjects](./REFERENCE.md#subjects) [js](./JAVASCRIPT.md#x)\n',
  'EXAMPLES.md':
    '[reference](./REFERENCE.md#claims) [js](./JAVASCRIPT.md) [examples](./EXAMPLES.md#a)\n',
  'JAVASCRIPT.md': '[reference](./REFERENCE.md) [faq](./FAQ.md)\n',
  'AMBIGUITY.md': '[examples](./EXAMPLES.md#b) [ambiguity](./AMBIGUITY.md#c)\n',
  [`${SKILL}/SKILL.md`]: `${skillHead}\n\nstale reference\n`,
};

describe('§1 — Generated skill files', () => {
  test('§1.1 — Generated method references match the method documents', async () => {
    const { root } = await runSynchronizer({
      ...sourceFiles,
      [`${SKILL}/references/README.md`]: 'stale readme\n',
      [`${SKILL}/references/REFERENCE.md`]: 'stale reference\n',
      [`${SKILL}/references/EXAMPLES.md`]: 'stale examples\n',
    });

    try {
      const references = path.join(root, SKILL, 'references');
      expect((await readdir(references)).sort()).toEqual([
        'AMBIGUITY.md',
        'EXAMPLES.md',
        'JAVASCRIPT.md',
      ]);
      expect(await readFile(path.join(references, 'AMBIGUITY.md'), 'utf8')).toBe(
        '[examples](EXAMPLES.md#b) [ambiguity](#c)\n',
      );
      expect(await readFile(path.join(references, 'EXAMPLES.md'), 'utf8')).toBe(
        '[reference](../SKILL.md#claims) [js](JAVASCRIPT.md) [examples](#a)\n',
      );
      expect(
        await readFile(path.join(references, 'JAVASCRIPT.md'), 'utf8'),
      ).toBe(`[reference](../SKILL.md) [faq](${BLOB}/FAQ.md)\n`);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§1.2 — The skill contains the reference after the marker', async () => {
    const { root } = await runSynchronizer(sourceFiles);

    try {
      expect(await readFile(path.join(root, SKILL, 'SKILL.md'), 'utf8')).toBe(
        `${skillHead}\n\n[readme](${BLOB}/README.md) [subjects](#subjects) [js](references/JAVASCRIPT.md#x)\n`,
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
