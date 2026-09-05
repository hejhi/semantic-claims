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

const CLI = fileURLToPath(
  new URL('./check-semantics.mjs', import.meta.url),
);
const SOURCE_SKILL = fileURLToPath(
  new URL('../.agents/skills/semantic-claims', import.meta.url),
);

async function runCommand(cwd: string, ...arguments_: string[]) {
  const child = Bun.spawn({
    cmd: [process.execPath, CLI, ...arguments_],
    cwd,
    stderr: 'pipe',
    stdout: 'pipe',
  });
  const [exitCode, stderr, stdout] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
    new Response(child.stdout).text(),
  ]);
  return { exitCode, stderr, stdout };
}

async function readTree(
  root: string,
  directory = root,
): Promise<Record<string, string>> {
  const tree: Record<string, string> = {};
  for (const entry of (
    await readdir(directory, { withFileTypes: true })
  ).sort((left, right) => left.name.localeCompare(right.name))) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(tree, await readTree(root, filePath));
    } else {
      tree[path.relative(root, filePath)] = await readFile(
        filePath,
        'utf8',
      );
    }
  }
  return tree;
}

describe('§1 — Destination', () => {
  test('§1.1 — Commands manage the skill beneath the selected directory', async () => {
    const root = await mkdtemp(
      path.join(tmpdir(), 'semantic-claims-skill-destination-'),
    );
    const workingDirectory = path.join(root, 'working');
    const selectedDirectory = path.join(root, 'selected');
    await mkdir(workingDirectory);

    try {
      const implicit = await runCommand(
        workingDirectory,
        'skill',
        'install',
      );
      expect(implicit.exitCode).toBe(0);
      expect(
        await readTree(
          path.join(workingDirectory, 'semantic-claims'),
        ),
      ).toEqual(await readTree(SOURCE_SKILL));

      await writeFile(
        path.join(
          workingDirectory,
          'semantic-claims',
          'obsolete.txt',
        ),
        'obsolete\n',
      );
      const implicitUpdate = await runCommand(
        workingDirectory,
        'skill',
        'update',
      );
      expect(implicitUpdate.exitCode).toBe(0);
      expect(
        await readTree(
          path.join(workingDirectory, 'semantic-claims'),
        ),
      ).toEqual(await readTree(SOURCE_SKILL));

      const implicitRemoval = await runCommand(
        workingDirectory,
        'skill',
        'remove',
      );
      expect(implicitRemoval.exitCode).toBe(0);
      expect(await readdir(workingDirectory)).toEqual([]);

      const explicit = await runCommand(
        workingDirectory,
        'skill',
        'install',
        selectedDirectory,
      );
      expect(explicit.exitCode).toBe(0);
      expect(
        await readTree(
          path.join(selectedDirectory, 'semantic-claims'),
        ),
      ).toEqual(await readTree(SOURCE_SKILL));
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
