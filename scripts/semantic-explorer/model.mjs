import path from 'node:path';
import { loadRepository } from '../check-semantics/repository.mjs';

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
  const { errors, records, repositoryRoot } = await loadRepository(root);
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
}
