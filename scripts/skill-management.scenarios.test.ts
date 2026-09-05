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

async function exists(filePath: string) {
  try {
    await readdir(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function createFixture() {
  const root = await mkdtemp(
    path.join(tmpdir(), 'semantic-claims-skill-management-'),
  );
  const destination = path.join(root, 'skills');
  await mkdir(destination);
  return { destination, root };
}

describe('§1 — Installation', () => {
  test('§1.1 — Installation adds the packaged skill without replacing an existing entry', async () => {
    const { destination, root } = await createFixture();
    const target = path.join(destination, 'semantic-claims');

    try {
      const installed = await runCommand(
        root,
        'skill',
        'install',
        destination,
      );
      expect(installed.exitCode).toBe(0);
      expect(await readTree(target)).toEqual(
        await readTree(SOURCE_SKILL),
      );

      await writeFile(path.join(target, 'local.txt'), 'keep me\n');
      const before = await readTree(target);
      const repeated = await runCommand(
        root,
        'skill',
        'install',
        destination,
      );
      expect(repeated.exitCode).toBe(1);
      expect(repeated.stderr).toContain('already exists');
      expect(await readTree(target)).toEqual(before);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});

describe('§2 — Update', () => {
  test('§2.1 — Update replaces only an existing Semantic Claims skill', async () => {
    const { destination, root } = await createFixture();
    const target = path.join(destination, 'semantic-claims');
    const sibling = path.join(destination, 'another-skill');

    try {
      expect(
        (
          await runCommand(
            root,
            'skill',
            'install',
            destination,
          )
        ).exitCode,
      ).toBe(0);
      await writeFile(path.join(target, 'obsolete.txt'), 'obsolete\n');
      await mkdir(sibling);
      await writeFile(path.join(sibling, 'SKILL.md'), 'sibling\n');

      const updated = await runCommand(
        root,
        'skill',
        'update',
        destination,
      );
      expect(updated.exitCode).toBe(0);
      expect(await readTree(target)).toEqual(
        await readTree(SOURCE_SKILL),
      );
      expect(await readFile(path.join(sibling, 'SKILL.md'), 'utf8')).toBe(
        'sibling\n',
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§2.1 — Update replaces only an existing Semantic Claims skill', async () => {
    const { destination, root } = await createFixture();
    const target = path.join(destination, 'semantic-claims');

    try {
      const absentBefore = await readTree(destination);
      const absent = await runCommand(
        root,
        'skill',
        'update',
        destination,
      );
      expect(absent.exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(absentBefore);

      await mkdir(target);
      await writeFile(
        path.join(target, 'SKILL.md'),
        '---\nname: another-skill\n---\n',
      );
      const otherBefore = await readTree(destination);
      const other = await runCommand(
        root,
        'skill',
        'update',
        destination,
      );
      expect(other.exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(otherBefore);

      await writeFile(
        path.join(target, 'SKILL.md'),
        '---\nname: semantic-claims # local note\ndescription: Local copy\n---\n',
      );
      const commented = await runCommand(
        root,
        'skill',
        'update',
        destination,
      );
      expect(commented.exitCode).toBe(0);
      expect(await readTree(target)).toEqual(
        await readTree(SOURCE_SKILL),
      );

      await writeFile(
        path.join(target, 'SKILL.md'),
        '---\nname: semantic-claims\nname: another-skill\n---\n',
      );
      const duplicateBefore = await readTree(destination);
      const duplicate = await runCommand(
        root,
        'skill',
        'update',
        destination,
      );
      expect(duplicate.exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(duplicateBefore);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});

describe('§3 — Removal', () => {
  test('§3.1 — Removal deletes only an existing Semantic Claims skill', async () => {
    const { destination, root } = await createFixture();
    const target = path.join(destination, 'semantic-claims');
    const sibling = path.join(destination, 'another-skill');

    try {
      expect(
        (
          await runCommand(
            root,
            'skill',
            'install',
            destination,
          )
        ).exitCode,
      ).toBe(0);
      await mkdir(sibling);
      await writeFile(path.join(sibling, 'SKILL.md'), 'sibling\n');

      const removed = await runCommand(
        root,
        'skill',
        'remove',
        destination,
      );
      expect(removed.exitCode).toBe(0);
      expect(await exists(target)).toBe(false);
      expect(await readFile(path.join(sibling, 'SKILL.md'), 'utf8')).toBe(
        'sibling\n',
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§3.1 — Removal deletes only an existing Semantic Claims skill', async () => {
    const { destination, root } = await createFixture();
    const target = path.join(destination, 'semantic-claims');

    try {
      const absentBefore = await readTree(destination);
      const absent = await runCommand(
        root,
        'skill',
        'remove',
        destination,
      );
      expect(absent.exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(absentBefore);

      await mkdir(target);
      await writeFile(
        path.join(target, 'SKILL.md'),
        '---\nname: another-skill\n---\n',
      );
      const otherBefore = await readTree(destination);
      const other = await runCommand(
        root,
        'skill',
        'remove',
        destination,
      );
      expect(other.exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(otherBefore);

      await writeFile(
        path.join(target, 'SKILL.md'),
        '---\nname: semantic-claims # local note\ndescription: Local copy\n---\n',
      );
      const commented = await runCommand(
        root,
        'skill',
        'remove',
        destination,
      );
      expect(commented.exitCode).toBe(0);
      expect(await exists(target)).toBe(false);

      await mkdir(target);
      await writeFile(
        path.join(target, 'SKILL.md'),
        '---\nname: semantic-claims\nname: another-skill\n---\n',
      );
      const duplicateBefore = await readTree(destination);
      const duplicate = await runCommand(
        root,
        'skill',
        'remove',
        destination,
      );
      expect(duplicate.exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(duplicateBefore);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
