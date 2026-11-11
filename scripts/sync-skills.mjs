#!/usr/bin/env bun
// Builds the generated parts of the semantic-claims skill from the method documents.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SKILL = '.agents/skills/semantic-claims';
const SKILL_FILE = path.join(SKILL, 'SKILL.md');
const MARKER =
  '<!-- Generated from REFERENCE.md by "bun run sync:skills". Edit REFERENCE.md instead of the text below. -->';
const REFERENCES = ['AMBIGUITY.md', 'EXAMPLES.md', 'JAVASCRIPT.md'];
const REPOSITORY_URL = 'https://github.com/hejhi/semantic-claims/blob/main';

// The skill-relative path of each method document that the skill contains.
const LOCATIONS = new Map([
  ['REFERENCE.md', 'SKILL.md'],
  ...REFERENCES.map((document) => [document, `references/${document}`]),
]);

// Rewrites each `./` link target for the generated skill file at the skill-relative path `file`.
function convertLinks(markdown, file) {
  return markdown.replace(/\]\(\.\/([^)#]*)([^)]*)\)/g, (_, target, anchor) => {
    const location = LOCATIONS.get(target);
    if (!location) {
      return `](${REPOSITORY_URL}/${target}${anchor})`;
    }
    if (location === file && anchor) {
      return `](${anchor})`;
    }
    return `](${path.posix.relative(path.posix.dirname(file), location)}${anchor})`;
  });
}

const skill = await readFile(SKILL_FILE, 'utf8');
const end = skill.indexOf(MARKER);
if (end === -1) {
  throw new Error(`${SKILL_FILE} must contain the line ${MARKER}`);
}
const reference = (await readFile('REFERENCE.md', 'utf8')).replace(/^# .*\n+/, '');
await writeFile(
  SKILL_FILE,
  `${skill.slice(0, end + MARKER.length)}\n\n${convertLinks(reference, 'SKILL.md')}`,
);

await rm(path.join(SKILL, 'references'), { force: true, recursive: true });
await mkdir(path.join(SKILL, 'references'));
for (const document of REFERENCES) {
  await writeFile(
    path.join(SKILL, 'references', document),
    convertLinks(await readFile(document, 'utf8'), `references/${document}`),
  );
}
console.log(`generated ${SKILL_FILE} and ${REFERENCES.length} references`);
