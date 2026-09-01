import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  parseClaimDocument,
  parseProof,
} from '../check-semantics/parse.mjs';
import {
  openTypeScriptSources,
  ts,
} from '../check-semantics/typescript.mjs';
import { validatePair } from '../check-semantics/validate.mjs';

const KINDS = [
  {
    claimPlural: 'invariants',
    claimSingular: 'invariant',
    fileSuffix: '.invariants',
    kind: 'invariant',
  },
  {
    claimPlural: 'scenarios',
    claimSingular: 'scenario',
    fileSuffix: '.scenarios',
    kind: 'scenario',
  },
];
const PROOF_EXTENSIONS = ['.test.ts', '.test.mjs', '.test.js'];
const SKIPPED_DIRECTORIES = new Set([
  'coverage',
  'dist',
  'node_modules',
]);

export class ExplorerModelError extends Error {
  constructor(errors) {
    super(`Semantic Explorer could not load valid claims and proofs:\n${errors
      .map((error) => `- ${error}`)
      .join('\n')}`);
    this.name = 'ExplorerModelError';
    this.errors = errors;
  }
}

function toRepositoryPath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
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
      continue;
    }
    if (
      entry.name.startsWith('.') ||
      SKIPPED_DIRECTORIES.has(entry.name)
    ) {
      continue;
    }
    files.push(...(await walk(filePath)));
  }
  return files;
}

function subjectFor(root, claimDocumentPath, config) {
  const relativePath = toRepositoryPath(root, claimDocumentPath);
  const suffix = `${config.fileSuffix}.md`;
  const id = relativePath.slice(0, -suffix.length);
  const basename = path.posix.basename(id);
  const seam = basename.startsWith('--');
  return {
    id,
    name: seam ? basename.slice(2) : basename,
    path: path.posix.dirname(id) === '.' ? '' : path.posix.dirname(id),
    seam,
  };
}

function claimKey(subjectId, kind, claimId) {
  return `${subjectId}:${kind}:${claimId}`;
}

export async function buildExplorerModel(root = process.cwd()) {
  const repositoryRoot = path.resolve(root);
  const files = await walk(repositoryRoot);
  const fileSet = new Set(files);
  const proofPaths = files.filter((filePath) =>
    KINDS.some((config) => isProofFile(filePath, config)),
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

    for (const config of KINDS) {
      const claimDocuments = files.filter((filePath) =>
        hasKindSuffix(filePath, config, '.md'),
      );
      const proofs = files.filter((filePath) =>
        isProofFile(filePath, config),
      );

      for (const proofPath of proofs) {
        const claimDocumentPath = claimDocumentPathFor(proofPath);
        if (!fileSet.has(claimDocumentPath)) {
          errors.push(
            `${toRepositoryPath(repositoryRoot, proofPath)}: expected paired ${config.claimSingular} claim document ${toRepositoryPath(repositoryRoot, claimDocumentPath)}.`,
          );
        }
      }

      for (const claimDocumentPath of claimDocuments) {
        const claimDocument = parseClaimDocument(
          await fs.readFile(claimDocumentPath, 'utf8'),
        );
        const pairedProofPaths = proofPathsFor(claimDocumentPath).filter(
          (proofPath) => fileSet.has(proofPath),
        );

        if (pairedProofPaths.length === 0) {
          errors.push(
            `${toRepositoryPath(repositoryRoot, claimDocumentPath)}: expected paired test file for ${config.claimSingular} claim document.`,
          );
          continue;
        }
        if (pairedProofPaths.length > 1) {
          errors.push(
            `${toRepositoryPath(repositoryRoot, claimDocumentPath)}: multiple paired test files; keep exactly one supported proof format.`,
          );
          continue;
        }

        const [proofPath] = pairedProofPaths;
        const proof = proofModels.get(proofPath);
        if (!proof) {
          throw new Error(
            `TypeScript did not load proof file ${toRepositoryPath(repositoryRoot, proofPath)}.`,
          );
        }

        errors.push(
          ...validatePair({
            config,
            proof,
            proofPath,
            relative: (filePath) =>
              toRepositoryPath(repositoryRoot, filePath),
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
      }
    }

    if (errors.length > 0) {
      throw new ExplorerModelError(errors);
    }

    const subjectsById = new Map();
    const claims = [];

    for (const record of records) {
      const subject = subjectFor(
        repositoryRoot,
        record.claimDocumentPath,
        record.config,
      );
      if (!subjectsById.has(subject.id)) {
        subjectsById.set(subject.id, { ...subject, claimKeys: [] });
      }

      const claimDocumentPath = toRepositoryPath(
        repositoryRoot,
        record.claimDocumentPath,
      );
      const proofPath = toRepositoryPath(repositoryRoot, record.proofPath);

      for (const claim of record.claimDocument.claims) {
        const sectionId = claim.id.split('.')[0];
        const section = record.claimDocument.sections.find(
          ({ id }) => id === sectionId,
        );
        const key = claimKey(subject.id, record.config.kind, claim.id);
        const proofs = record.proof.claims
          .filter(
            (proof) =>
              proof.id === claim.id && proof.unprovenBy === null,
          )
          .map(({ line }) => ({ line, path: proofPath }));
        const projectedClaim = {
          id: claim.id,
          key,
          kind: record.config.kind,
          proofs,
          seam: subject.seam,
          section: section
            ? { id: section.id, title: section.title }
            : null,
          claimDocument: {
            line: claim.line,
            path: claimDocumentPath,
          },
          statement: claim.statement,
          subjectId: subject.id,
          title: claim.title,
        };
        claims.push(projectedClaim);
        subjectsById.get(subject.id).claimKeys.push(key);
      }
    }

    const subjects = [...subjectsById.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    claims.sort((left, right) => {
      const bySubject = left.subjectId.localeCompare(right.subjectId);
      if (bySubject !== 0) return bySubject;
      const byKind = left.kind.localeCompare(right.kind);
      if (byKind !== 0) return byKind;
      return left.id.localeCompare(right.id, undefined, { numeric: true });
    });

    return {
      claims,
      generatedAt: new Date().toISOString(),
      subjects,
    };
  } finally {
    await typeScriptSources.close();
  }
}
