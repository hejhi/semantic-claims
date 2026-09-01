#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  parseClaimDocument,
  parseProof,
} from './check-semantics/parse.mjs';
import {
  openTypeScriptSources,
  ts,
} from './check-semantics/typescript.mjs';
import { validatePair } from './check-semantics/validate.mjs';

const ROOT = process.cwd();
const KIND_CONFIG = {
  invariants: {
    claimPlural: 'invariants',
    claimSingular: 'invariant',
    fileSuffix: '.invariants',
  },
  scenarios: {
    claimPlural: 'scenarios',
    claimSingular: 'scenario',
    fileSuffix: '.scenarios',
  },
};
const PROOF_EXTENSIONS = ['.test.ts', '.test.mjs', '.test.js'];
const SKIPPED_DIRECTORIES = new Set([
  'coverage',
  'dist',
  'node_modules',
]);

function selectedKinds(arguments_) {
  const selections = new Set(arguments_);
  if (selections.size === 0) {
    return Object.keys(KIND_CONFIG);
  }
  return Object.keys(KIND_CONFIG).filter((kind) => selections.has(kind));
}

function hasKindSuffix(filePath, config, extension) {
  const basename = path.basename(filePath);
  const suffix = `${config.fileSuffix}${extension}`;
  return basename.endsWith(suffix) && basename.length > suffix.length;
}

function isProofFile(filePath, config) {
  return PROOF_EXTENSIONS.some((extension) =>
    hasKindSuffix(filePath, config, extension),
  );
}

function proofPathsFor(claimDocumentPath) {
  return PROOF_EXTENSIONS.map((extension) =>
    claimDocumentPath.replace(/\.md$/, extension),
  );
}

function claimDocumentPathFor(proofPath) {
  const extension = PROOF_EXTENSIONS.find((candidate) =>
    proofPath.endsWith(candidate),
  );
  return extension
    ? `${proofPath.slice(0, -extension.length)}.md`
    : proofPath;
}

function relative(filePath) {
  return path.relative(ROOT, filePath);
}

function printUsage() {
  console.error(
    'Usage: semantic-claims [invariants] [scenarios]\n' +
      '       semantic-claims explore',
  );
}

async function walk(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return [];
    }
    throw error;
  }

  const discovered = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(directory, entry.name);
      if (!entry.isDirectory()) {
        return [filePath];
      }
      if (
        entry.name.startsWith('.') ||
        SKIPPED_DIRECTORIES.has(entry.name)
      ) {
        return [];
      }
      return walk(filePath);
    }),
  );
  return discovered.flat();
}

async function checkKind({ files, kind, proofModels }) {
  const config = KIND_CONFIG[kind];
  const claimDocuments = files.filter((filePath) =>
    hasKindSuffix(filePath, config, '.md'),
  );
  const proofs = files.filter((filePath) => isProofFile(filePath, config));
  const fileSet = new Set(files);
  const errors = [];
  let checkedPairs = 0;

  for (const proofPath of proofs) {
    const claimDocumentPath = claimDocumentPathFor(proofPath);
    if (!fileSet.has(claimDocumentPath)) {
      errors.push(
        `${relative(proofPath)}: expected paired ${config.claimSingular} claim document ${relative(claimDocumentPath)}.`,
      );
    }
  }

  for (const claimDocumentPath of claimDocuments) {
    const claimDocument = parseClaimDocument(
      await fs.readFile(claimDocumentPath, 'utf8'),
    );

    if (
      claimDocument.sections.length === 0 &&
      claimDocument.claims.length === 0
    ) {
      errors.push(
        `${relative(claimDocumentPath)}: ${config.claimSingular} claim documents must declare § ids, with at least one section heading of the form "## §N ..." and one ${config.claimSingular} heading of the form "### §N.M ...".`,
      );
      continue;
    }

    const expectedProofPaths = proofPathsFor(claimDocumentPath);
    const pairedProofPaths = expectedProofPaths.filter((proofPath) =>
      fileSet.has(proofPath),
    );
    if (pairedProofPaths.length === 0) {
      errors.push(
        `${relative(claimDocumentPath)}: expected paired test file ${expectedProofPaths.map(relative).join(' or ')} for ${config.claimSingular} claim document.`,
      );
      continue;
    }
    if (pairedProofPaths.length > 1) {
      errors.push(
        `${relative(claimDocumentPath)}: multiple paired test files ${pairedProofPaths.map(relative).join(', ')}; keep exactly one supported proof format.`,
      );
      continue;
    }

    const [proofPath] = pairedProofPaths;

    const proof = proofModels.get(proofPath);
    if (!proof) {
      throw new Error(
        `TypeScript did not load proof file ${relative(proofPath)}.`,
      );
    }

    errors.push(
      ...validatePair({
        config,
        proof,
        proofPath,
        relative,
        claimDocument,
        claimDocumentPath,
      }),
    );
    checkedPairs++;
  }

  return { checkedPairs, errors };
}

async function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_[0] === 'explore') {
    if (arguments_.length !== 1) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    try {
      const { createExplorerServer } = await import(
        './semantic-explorer/server.mjs'
      );
      const explorer = await createExplorerServer({ root: ROOT });
      console.log(`Semantic Explorer: ${explorer.url}`);

      let closing = false;
      const close = async () => {
        if (closing) return;
        closing = true;
        await explorer.close();
      };
      process.once('SIGINT', close);
      process.once('SIGTERM', close);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
    return;
  }

  const unsupportedArguments = arguments_.filter(
    (argument) => !Object.hasOwn(KIND_CONFIG, argument),
  );
  if (unsupportedArguments.length > 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const kinds = selectedKinds(arguments_);
  const files = await walk(ROOT);
  const proofPaths = [
    ...new Set(
      kinds.flatMap((kind) => {
        const config = KIND_CONFIG[kind];
        return files.filter((filePath) => isProofFile(filePath, config));
      }),
    ),
  ];
  const typeScriptSources = await openTypeScriptSources(proofPaths, ROOT);

  try {
    const proofModels = new Map(
      [...typeScriptSources.sources].map(([filePath, sourceFile]) => [
        filePath,
        parseProof(sourceFile, ts),
      ]),
    );
    const results = [];
    const errors = [];

    for (const kind of kinds) {
      const result = await checkKind({ files, kind, proofModels });
      results.push({ kind, checkedPairs: result.checkedPairs });
      errors.push(...result.errors);
    }

    if (errors.length > 0) {
      console.error('Semantic claim validation failed:\n');
      for (const error of errors) {
        console.error(`- ${error}`);
      }
      process.exitCode = 1;
      return;
    }

    for (const { checkedPairs, kind } of results) {
      const config = KIND_CONFIG[kind];
      console.log(
        `${config.claimPlural[0].toUpperCase()}${config.claimPlural.slice(1)} validation passed for ${checkedPairs} named ${config.claimSingular} pair${checkedPairs === 1 ? '' : 's'}.`,
      );
    }
  } finally {
    await typeScriptSources.close();
  }
}

await main();
