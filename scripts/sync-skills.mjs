#!/usr/bin/env bun
// Builds generated skill references, then mirrors the skill into each runtime.
import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = '.agents/skills/semantic-claims';
const TARGETS = ['.claude/skills/semantic-claims'];
const SEMANTIC_CLAIMS_DOCS = [
  'SEMANTICS.md',
  'SUBJECTS.md',
  'FAQ.md',
  'INVARIANTS.md',
  'SCENARIOS.md',
  'EXAMPLES.md',
  'EXISTING-SYSTEMS.md',
  'ELEPHANT-GOLDFISH.md',
  'JAVASCRIPT.md',
];
const semanticClaimsReferences = path.join(SOURCE, 'references');

await mkdir(semanticClaimsReferences, { recursive: true });
for (const document of SEMANTIC_CLAIMS_DOCS) {
  await copyFile(document, path.join(semanticClaimsReferences, document));
}
console.log(
  `generated ${SEMANTIC_CLAIMS_DOCS.length} semantic-claims references`,
);

for (const target of TARGETS) {
  await rm(target, { force: true, recursive: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(SOURCE, target, { recursive: true });
  console.log(`synced ${SOURCE} -> ${target}`);
}
