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
const SOURCE_SKILLS = fileURLToPath(
  new URL('../.agents/skills', import.meta.url),
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

async function createFixture() {
  const root = await mkdtemp(
    path.join(tmpdir(), 'semantic-claims-skill-management-'),
  );
  const destination = path.join(root, 'skills');
  await mkdir(destination);
  return { destination, root };
}

const SKILL_NAMES = [
  'semantic-claims-claim',
  'semantic-claims-prove',
  'semantic-claims-implement',
  'semantic-claims-review',
];

async function expectPackagedSkills(destination: string) {
  for (const name of SKILL_NAMES) {
    expect(await readTree(path.join(destination, name))).toEqual(
      await readTree(path.join(SOURCE_SKILLS, name)),
    );
  }
}

describe('§1 — Installation', () => {
  test('§1.1 — Installation adds the packaged skills without replacing existing entries', async () => {
    const { destination, root } = await createFixture();
    try {
      await writeFile(path.join(destination, 'unrelated.txt'), 'keep me\n');
      expect((await runCommand(root, 'skill', 'install', destination)).exitCode).toBe(0);
      await expectPackagedSkills(destination);
      expect((await readdir(destination)).sort()).toEqual([...SKILL_NAMES, 'unrelated.txt'].sort());
      expect(await readFile(path.join(destination, 'unrelated.txt'), 'utf8')).toBe('keep me\n');

      await writeFile(path.join(destination, SKILL_NAMES[0]!, 'local.txt'), 'local edit\n');
      const before = await readTree(destination);
      const repeated = await runCommand(root, 'skill', 'install', destination);
      expect(repeated.exitCode).toBe(1);
      expect(repeated.stderr).toContain('already exists');
      expect(await readTree(destination)).toEqual(before);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§1.1 — Installation adds the packaged skills without replacing existing entries', async () => {
    const { destination, root } = await createFixture();
    try {
      for (const name of [...SKILL_NAMES, 'semantic-claims']) {
        const target = path.join(destination, name);
        await writeFile(target, 'unrelated entry\n');
        const before = await readTree(destination);
        expect((await runCommand(root, 'skill', 'install', destination)).exitCode).toBe(1);
        expect(await readTree(destination)).toEqual(before);
        await rm(target);
      }
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});

describe('§2 — Update', () => {
  test('§2.1 — Update replaces only recognized Semantic Claims skills', async () => {
    const { destination, root } = await createFixture();
    try {
      expect((await runCommand(root, 'skill', 'install', destination)).exitCode).toBe(0);
      for (const name of SKILL_NAMES) {
        await writeFile(path.join(destination, name, 'obsolete.txt'), 'obsolete\n');
      }
      await rm(path.join(destination, 'semantic-claims-prove'), { recursive: true });
      await writeFile(path.join(destination, 'unrelated.txt'), 'keep me\n');
      expect((await runCommand(root, 'skill', 'update', destination)).exitCode).toBe(0);
      await expectPackagedSkills(destination);
      expect((await readdir(destination)).sort()).toEqual([...SKILL_NAMES, 'unrelated.txt'].sort());
      expect(await readFile(path.join(destination, 'unrelated.txt'), 'utf8')).toBe('keep me\n');
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§2.1 — Update replaces only recognized Semantic Claims skills', async () => {
    const { destination, root } = await createFixture();
    try {
      const legacy = path.join(destination, 'semantic-claims');
      await mkdir(legacy);
      await writeFile(path.join(legacy, 'SKILL.md'), '---\nname: semantic-claims # local note\ndescription: Legacy skill\n---\n');
      await writeFile(path.join(legacy, 'obsolete.txt'), 'obsolete\n');
      expect((await runCommand(root, 'skill', 'update', destination)).exitCode).toBe(0);
      await expectPackagedSkills(destination);
      expect((await readdir(destination)).sort()).toEqual([...SKILL_NAMES].sort());
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§2.1 — Update replaces only recognized Semantic Claims skills', async () => {
    await expectRejectedChanges('update');
  });
});

describe('§3 — Removal', () => {
  test('§3.1 — Removal deletes only recognized Semantic Claims skills', async () => {
    const { destination, root } = await createFixture();
    try {
      expect((await runCommand(root, 'skill', 'install', destination)).exitCode).toBe(0);
      await rm(path.join(destination, 'semantic-claims-claim'), { recursive: true });
      const legacy = path.join(destination, 'semantic-claims');
      await mkdir(legacy);
      await writeFile(path.join(legacy, 'SKILL.md'), '---\nname: semantic-claims # local note\n---\n');
      await writeFile(path.join(destination, 'unrelated.txt'), 'keep me\n');
      expect((await runCommand(root, 'skill', 'remove', destination)).exitCode).toBe(0);
      expect(await readTree(destination)).toEqual({ 'unrelated.txt': 'keep me\n' });
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('§3.1 — Removal deletes only recognized Semantic Claims skills', async () => {
    await expectRejectedChanges('remove');
  });
});

async function expectRejectedChanges(operation: string) {
  const { destination, root } = await createFixture();
  try {
    expect((await runCommand(root, 'skill', operation, destination)).exitCode).toBe(1);
    expect(await readdir(destination)).toEqual([]);
    expect((await runCommand(root, 'skill', 'install', destination)).exitCode).toBe(0);
    for (const name of ['semantic-claims-review', 'semantic-claims']) {
      const target = path.join(destination, name);
      await rm(target, { recursive: true, force: true });
      await writeFile(target, 'unrelated file\n');
      let before = await readTree(destination);
      expect((await runCommand(root, 'skill', operation, destination)).exitCode).toBe(1);
      expect(await readTree(destination)).toEqual(before);
      await rm(target);
      await mkdir(target);
      for (const content of [
        '',
        '---\nname: another-skill\n---\n',
        `---\nname: ${name}\nname: another-skill\n---\n`,
        '---\nname: [invalid\n---\n',
      ]) {
        await writeFile(path.join(target, 'SKILL.md'), content);
        before = await readTree(destination);
        expect((await runCommand(root, 'skill', operation, destination)).exitCode).toBe(1);
        expect(await readTree(destination)).toEqual(before);
      }
      if (name === 'semantic-claims-review') {
        await writeFile(path.join(target, 'SKILL.md'), `---\nname: ${name} # local note\n---\n`);
      }
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}
