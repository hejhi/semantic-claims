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

const SKILL_NAME = 'semantic-claims';
const SOURCE_SKILL = fileURLToPath(
  new URL('../.agents/skills/semantic-claims', import.meta.url),
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

async function requireSemanticClaimsSkill(target) {
  if (!(await pathExists(target))) {
    throw new Error(`No Semantic Claims skill exists at ${target}.`);
  }

  let markdown;
  try {
    markdown = await readFile(path.join(target, 'SKILL.md'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw new Error(
        `The entry at ${target} is not the Semantic Claims skill.`,
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
    document.get('name') !== SKILL_NAME
  ) {
    throw new Error(
      `The entry at ${target} is not the Semantic Claims skill.`,
    );
  }
}

async function stagePackagedSkill(destination) {
  await mkdir(destination, { recursive: true });
  const stagingRoot = await mkdtemp(
    path.join(destination, `.${SKILL_NAME}-`),
  );
  const stagedSkill = path.join(stagingRoot, SKILL_NAME);
  try {
    await cp(SOURCE_SKILL, stagedSkill, { recursive: true });
  } catch (error) {
    await rm(stagingRoot, { force: true, recursive: true });
    throw error;
  }
  return { stagedSkill, stagingRoot };
}

async function installSkill(destination, target) {
  if (await pathExists(target)) {
    throw new Error(
      `A semantic-claims entry already exists at ${target}. Use "skill update" to replace an existing Semantic Claims skill.`,
    );
  }

  const { stagedSkill, stagingRoot } =
    await stagePackagedSkill(destination);
  try {
    await rename(stagedSkill, target);
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
}

async function updateSkill(destination, target) {
  await requireSemanticClaimsSkill(target);
  const { stagedSkill, stagingRoot } =
    await stagePackagedSkill(destination);
  const previousSkill = path.join(stagingRoot, 'previous');

  try {
    await rename(target, previousSkill);
    try {
      await rename(stagedSkill, target);
    } catch (error) {
      await rename(previousSkill, target);
      throw error;
    }
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }
}

export async function runSkillManagement(arguments_, cwd = process.cwd()) {
  const [operation, directory, ...extraArguments] = arguments_;
  if (!OPERATIONS.has(operation) || extraArguments.length > 0) {
    throw new Error(
      'Usage: semantic-claims skill <install|update|remove> [directory]',
    );
  }

  const destination = path.resolve(cwd, directory ?? '.');
  const target = path.join(destination, SKILL_NAME);

  if (operation === 'install') {
    await installSkill(destination, target);
    return `Installed Semantic Claims skill at ${target}.`;
  }
  if (operation === 'update') {
    await updateSkill(destination, target);
    return `Updated Semantic Claims skill at ${target}.`;
  }

  await requireSemanticClaimsSkill(target);
  await rm(target, { recursive: true });
  return `Removed Semantic Claims skill from ${target}.`;
}
