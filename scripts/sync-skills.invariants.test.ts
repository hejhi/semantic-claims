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

const sourceFiles = {
  'README.md': [
    'source [reference](./REFERENCE.md#claims)',
    '[scripts](./scripts)',
    '![explorer](./assets/explorer.png)',
    '',
  ].join('\n'),
  'REFERENCE.md': 'source reference\n',
  'FAQ.md': 'source frequently asked questions\n',
  'EXAMPLES.md': 'source examples\n',
  'JAVASCRIPT.md': 'source javascript conventions\n',
  '.agents/skills/semantic-claims/SKILL.md': 'source skill\n',
};

const portableReadme = [
  'source [reference](https://github.com/hejhi/semantic-claims/blob/main/REFERENCE.md#claims)',
  '[scripts](https://github.com/hejhi/semantic-claims/tree/main/scripts)',
  '![explorer](https://raw.githubusercontent.com/hejhi/semantic-claims/main/assets/explorer.png)',
  '',
].join('\n');

describe('§1 — Generated method references', () => {
  test('§1.1 — Generated method references exactly match the configured source documents', async () => {
    const { root } = await runSynchronizer({
      ...sourceFiles,
      '.agents/skills/semantic-claims/references/OBSOLETE.md':
        'obsolete reference\n',
      '.agents/skills/semantic-claims/references/CLAIMS.md':
        'stale claims\n',
      '.agents/skills/semantic-claims/references/SEMANTICS.md':
        'stale semantics\n',
      '.agents/skills/semantic-claims/references/README.md':
        'stale readme\n',
      '.agents/skills/semantic-claims/references/REFERENCE.md':
        'stale reference\n',
      '.agents/skills/semantic-claims/references/FAQ.md':
        'stale frequently asked questions\n',
      '.agents/skills/semantic-claims/references/EXAMPLES.md':
        'stale examples\n',
      '.agents/skills/semantic-claims/references/EXISTING-SYSTEMS.md':
        'stale existing systems\n',
      '.agents/skills/semantic-claims/references/JAVASCRIPT.md':
        'stale javascript conventions\n',
    });

    try {
      for (const document of [
        'README.md',
        'REFERENCE.md',
        'FAQ.md',
        'EXAMPLES.md',
        'JAVASCRIPT.md',
      ]) {
        const source = await readFile(path.join(root, document), 'utf8');
        const generated = await readFile(
          path.join(
            root,
            '.agents/skills/semantic-claims/references',
            document,
          ),
          'utf8',
        );
        expect(generated).toBe(
          document === 'README.md' ? portableReadme : source,
        );
      }
      expect(
        (
          await readdir(
            path.join(root, '.agents/skills/semantic-claims/references'),
          )
        ).sort(),
      ).toEqual([
        'EXAMPLES.md',
        'FAQ.md',
        'JAVASCRIPT.md',
        'README.md',
        'REFERENCE.md',
      ]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
