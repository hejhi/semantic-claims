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

async function readTree(
  root: string,
  directory = root,
): Promise<Record<string, string>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const tree: Record<string, string> = {};

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(tree, await readTree(root, fullPath));
    } else {
      tree[path.relative(root, fullPath)] = await readFile(fullPath, 'utf8');
    }
  }

  return tree;
}

const sourceFiles = {
  'SEMANTICS.md': 'source semantics\n',
  'CLAIMS.md': 'source claims\n',
  'FAQ.md': 'source frequently asked questions\n',
  'EXAMPLES.md': 'source examples\n',
  'EXISTING-SYSTEMS.md': 'source existing systems\n',
  'ELEPHANT-GOLDFISH.md': 'source elephant goldfish\n',
  'JAVASCRIPT.md': 'source javascript conventions\n',
  '.agents/skills/semantic-claims/SKILL.md': 'source skill\n',
};

describe('§1 — Generated method references', () => {
  test('§1.1 — Generated method references exactly match the configured source documents', async () => {
    const { root } = await runSynchronizer({
      ...sourceFiles,
      '.agents/skills/semantic-claims/references/OBSOLETE.md':
        'obsolete reference\n',
      '.agents/skills/semantic-claims/references/SEMANTICS.md':
        'stale semantics\n',
      '.agents/skills/semantic-claims/references/CLAIMS.md':
        'stale claims\n',
      '.agents/skills/semantic-claims/references/FAQ.md':
        'stale frequently asked questions\n',
      '.agents/skills/semantic-claims/references/EXAMPLES.md':
        'stale examples\n',
      '.agents/skills/semantic-claims/references/EXISTING-SYSTEMS.md':
        'stale existing systems\n',
      '.agents/skills/semantic-claims/references/ELEPHANT-GOLDFISH.md':
        'stale elephant goldfish\n',
      '.agents/skills/semantic-claims/references/JAVASCRIPT.md':
        'stale javascript conventions\n',
    });

    try {
      for (const document of [
        'SEMANTICS.md',
        'CLAIMS.md',
        'FAQ.md',
        'EXAMPLES.md',
        'EXISTING-SYSTEMS.md',
        'ELEPHANT-GOLDFISH.md',
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
        expect(generated).toBe(source);
      }
      expect(
        (
          await readdir(
            path.join(root, '.agents/skills/semantic-claims/references'),
          )
        ).sort(),
      ).toEqual([
        'CLAIMS.md',
        'ELEPHANT-GOLDFISH.md',
        'EXAMPLES.md',
        'EXISTING-SYSTEMS.md',
        'FAQ.md',
        'JAVASCRIPT.md',
        'SEMANTICS.md',
      ]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});

describe('§2 — Runtime skill mirrors', () => {
  test('§2.1 — Every runtime Semantic Claims skill exactly mirrors its source', async () => {
    const { root } = await runSynchronizer({
      ...sourceFiles,
      '.agents/skills/semantic-claims/agents/openai.yaml': 'metadata\n',
      '.agents/skills/another-skill/SKILL.md': 'source-only skill\n',
      '.claude/skills/another-skill/SKILL.md': 'runtime skill\n',
      '.claude/skills/runtime-only.txt': 'keep me\n',
      '.claude/skills/semantic-claims/SKILL.md': 'stale skill\n',
    });

    try {
      const source = await readTree(
        path.join(root, '.agents/skills/semantic-claims'),
      );
      const runtime = await readTree(
        path.join(root, '.claude/skills/semantic-claims'),
      );
      expect(runtime).toEqual(source);
      expect(
        await readFile(
          path.join(root, '.claude/skills/another-skill/SKILL.md'),
          'utf8',
        ),
      ).toBe('runtime skill\n');
      expect(
        await readFile(
          path.join(root, '.claude/skills/runtime-only.txt'),
          'utf8',
        ),
      ).toBe('keep me\n');
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
