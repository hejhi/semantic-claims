import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseClaimDocument, parseProof } from './parse.mjs';
import { openTypeScriptSources, ts } from './typescript.mjs';
import { validatePair } from './validate.mjs';

export const KIND_CONFIG = {
  invariants: {
    claimPlural: 'invariants',
    claimSingular: 'invariant',
    fileSuffix: '.invariants',
    kind: 'invariant',
  },
  scenarios: {
    claimPlural: 'scenarios',
    claimSingular: 'scenario',
    fileSuffix: '.scenarios',
    kind: 'scenario',
  },
};

const PROOF_EXTENSIONS = ['.test.ts', '.test.mjs', '.test.js'];
const SKIPPED_DIRECTORIES = new Set([
  'coverage',
  'dist',
  'node_modules',
]);

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

  entries.sort((left, right) => left.name.localeCompare(right.name));
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (!entry.isDirectory()) {
      files.push(filePath);
    } else if (
      !entry.name.startsWith('.') &&
      !SKIPPED_DIRECTORIES.has(entry.name)
    ) {
      files.push(...(await walk(filePath)));
    }
  }
  return files;
}

export async function loadRepository(
  root,
  kinds = Object.keys(KIND_CONFIG),
) {
  const repositoryRoot = path.resolve(root);
  const relative = (filePath) =>
    path.relative(repositoryRoot, filePath).split(path.sep).join('/');
  const files = await walk(repositoryRoot);
  const fileSet = new Set(files);
  const configs = kinds.map((kind) => KIND_CONFIG[kind]);
  const proofPaths = files.filter((filePath) =>
    configs.some((config) => isProofFile(filePath, config)),
  );
  const typeScriptSources = await openTypeScriptSources(
    proofPaths,
    repositoryRoot,
  );

  try {
    const proofModels = new Map(
      [...typeScriptSources.sources].map(([filePath, sourceFile]) => [
        filePath,
        parseProof(sourceFile, ts),
      ]),
    );
    const errors = [];
    const records = [];
    const results = [];

    for (const config of configs) {
      const claimDocuments = files.filter((filePath) =>
        hasKindSuffix(filePath, config, '.md'),
      );
      const proofs = files.filter((filePath) =>
        isProofFile(filePath, config),
      );
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
        records.push({
          config,
          claimDocument,
          claimDocumentPath,
          proof,
          proofPath,
        });
        checkedPairs++;
      }

      results.push({ checkedPairs, kind: config.claimPlural });
    }

    return { errors, records, repositoryRoot, results };
  } finally {
    await typeScriptSources.close();
  }
}
