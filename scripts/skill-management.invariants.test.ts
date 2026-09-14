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

const SKILL_NAMES = [
  'semantic-claims-claim',
  'semantic-claims-prove',
  'semantic-claims-implement',
  'semantic-claims-review',
];

async function expectPackagedSkills(destination: string) {
  expect((await readdir(destination)).sort()).toEqual([...SKILL_NAMES].sort());
  for (const name of SKILL_NAMES) {
    expect(await readTree(path.join(destination, name))).toEqual(
      await readTree(path.join(SOURCE_SKILLS, name)),
    );
  }
}

describe('§1 — Destination', () => {
  test('§1.1 — Commands manage the skills beneath the selected directory', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'semantic-claims-skill-destination-'));
    const workingDirectory = path.join(root, 'working');
    const selectedDirectory = path.join(root, 'selected');
    const defaultDirectory = path.join(workingDirectory, '.agents', 'skills');
    await mkdir(workingDirectory);

    try {
      for (const [destination, arguments_] of [
        [defaultDirectory, []],
        [selectedDirectory, [selectedDirectory]],
        [selectedDirectory, ['../selected']],
      ] as const) {
        expect((await runCommand(workingDirectory, 'skill', 'install', ...arguments_)).exitCode).toBe(0);
        await expectPackagedSkills(destination);
        await writeFile(path.join(destination, SKILL_NAMES[0]!, 'obsolete.txt'), 'obsolete\n');
        expect((await runCommand(workingDirectory, 'skill', 'update', ...arguments_)).exitCode).toBe(0);
        await expectPackagedSkills(destination);
        expect((await runCommand(workingDirectory, 'skill', 'remove', ...arguments_)).exitCode).toBe(0);
        expect(await readdir(destination)).toEqual([]);
      }
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
