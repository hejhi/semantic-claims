import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const SKILL_NAMES = [
  'semantic-claims-claim',
  'semantic-claims-prove',
  'semantic-claims-implement',
  'semantic-claims-review',
];
const LEGACY_SKILL = 'semantic-claims';
const SOURCE_SKILLS = fileURLToPath(
  new URL('../.agents/skills', import.meta.url),
);
const OPERATIONS = new Set(['install', 'remove', 'update']);

async function pathExists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function requireSemanticClaimsSkill(target, name) {
  let markdown;
  try {
    markdown = await readFile(path.join(target, 'SKILL.md'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw new Error(
        `The entry at ${target} is not the ${name} skill.`,
      );
    }
    throw error;
  }

  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(
    markdown,
  )?.[1];
  const document = frontmatter
    ? parseDocument(frontmatter, { uniqueKeys: true })
    : undefined;
  if (
    !document ||
    document.errors.length > 0 ||
    document.get('name') !== name
  ) {
    throw new Error(
      `The entry at ${target} is not the ${name} skill.`,
    );
  }
}

async function replaceSkills(destination, existing, incoming) {
  await mkdir(destination, { recursive: true });
  const stagingRoot = await mkdtemp(
    path.join(destination, '.semantic-claims-'),
  );
  const previous = [];
  const installed = [];
  try {
    for (const name of incoming) {
      await cp(path.join(SOURCE_SKILLS, name), path.join(stagingRoot, name), {
        recursive: true,
      });
    }
    for (const name of existing) {
      await rename(path.join(destination, name), path.join(stagingRoot, `previous-${name}`));
      previous.push(name);
    }
    for (const name of incoming) {
      await rename(path.join(stagingRoot, name), path.join(destination, name));
      installed.push(name);
    }
  } catch (error) {
    for (const name of installed.reverse()) {
      await rm(path.join(destination, name), { recursive: true });
    }
    for (const name of previous.reverse()) {
      await rename(path.join(stagingRoot, `previous-${name}`), path.join(destination, name));
    }
    await rm(stagingRoot, { force: true, recursive: true });
    throw error;
  }
  await rm(stagingRoot, { force: true, recursive: true });
}

export async function runSkillManagement(arguments_, cwd = process.cwd()) {
  const [operation, directory, ...extraArguments] = arguments_;
  if (!OPERATIONS.has(operation) || extraArguments.length > 0) {
    throw new Error(
      'Usage: semantic-claims skill <install|update|remove> [directory]',
    );
  }

  const destination = path.resolve(cwd, directory ?? '.agents/skills');
  const existing = [];
  for (const name of [...SKILL_NAMES, LEGACY_SKILL]) {
    const target = path.join(destination, name);
    if (!(await pathExists(target))) continue;
    if (operation === 'install') {
      throw new Error(
        `An entry already exists at ${target}. Use "skill update" to replace existing Semantic Claims skills.`,
      );
    }
    await requireSemanticClaimsSkill(target, name);
    existing.push(name);
  }
  if (operation !== 'install' && existing.length === 0) {
    throw new Error(`No Semantic Claims skills exist at ${destination}.`);
  }
  await replaceSkills(destination, existing, operation === 'remove' ? [] : SKILL_NAMES);
  const verb = { install: 'Installed', update: 'Updated', remove: 'Removed' }[operation];
  return `${verb} Semantic Claims skills ${operation === 'remove' ? 'from' : 'at'} ${destination}.`;
}
