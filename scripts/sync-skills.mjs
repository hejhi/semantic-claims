#!/usr/bin/env bun
// Builds generated skill references from the method documents.
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const SOURCE = '.agents/skills/semantic-claims';
const SEMANTIC_CLAIMS_DOCS = [
  'README.md',
  'REFERENCE.md',
  'FAQ.md',
  'EXAMPLES.md',
  'JAVASCRIPT.md',
];
const semanticClaimsReferences = path.join(SOURCE, 'references');
const REPOSITORY_URL = 'https://github.com/hejhi/semantic-claims';
const REPOSITORY_DIRECTORIES = new Set([
  '.agents/skills/semantic-claims',
  'scripts',
]);

function makeReadmePortable(markdown) {
  const withPortableImages = markdown.replace(
    /!\[([^\]]*)\]\(\.\/([^)]+)\)/g,
    (_, alt, target) =>
      `![${alt}](https://raw.githubusercontent.com/hejhi/semantic-claims/main/${target})`,
  );

  return withPortableImages.replace(
    /\[([^\]]+)\]\(\.\/([^)]+)\)/g,
    (_, label, target) => {
      const targetPath = target.split(/[?#]/, 1)[0];
      const view = REPOSITORY_DIRECTORIES.has(targetPath) ? 'tree' : 'blob';
      return `[${label}](${REPOSITORY_URL}/${view}/main/${target})`;
    },
  );
}

await rm(semanticClaimsReferences, { force: true, recursive: true });
await mkdir(semanticClaimsReferences, { recursive: true });
for (const document of SEMANTIC_CLAIMS_DOCS) {
  const target = path.join(semanticClaimsReferences, document);
  if (document === 'README.md') {
    const markdown = await readFile(document, 'utf8');
    await writeFile(target, makeReadmePortable(markdown));
  } else {
    await copyFile(document, target);
  }
}
console.log(
  `generated ${SEMANTIC_CLAIMS_DOCS.length} semantic-claims references`,
);
