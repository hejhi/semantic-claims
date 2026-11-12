import path from 'node:path';

function unique(values) {
  return [...new Set(values)];
}

function duplicateIds(entries) {
  const counts = new Map();
  for (const { id } of entries) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

function titledEntries(entries) {
  const byId = new Map();
  for (const entry of entries) {
    if (entry.title && !byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }
  return byId;
}

function groupedTitles(entries) {
  const byId = new Map();
  for (const entry of entries) {
    if (!entry.id || !entry.title) {
      continue;
    }
    const titles = byId.get(entry.id) ?? [];
    titles.push(entry.title);
    byId.set(entry.id, titles);
  }
  return byId;
}

function difference(expected, actual) {
  return expected.filter((value) => !actual.includes(value));
}

function formatIds(ids) {
  return ids.map((id) => `§${id}`).join(', ');
}

function parentIdOf(claimId) {
  return claimId.split('.')[0];
}

function maskCode(text) {
  return text.replace(/(`+)[\s\S]*?\1/g, (span) => span.replace(/[^`]/g, 'x'));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KEYWORD = '\\b(?:WHERE|WHILE|WHEN|IF|THEN|SHALL)\\b';
const SLOT = `(?:(?!${KEYWORD}).)+?`;
const TEMPLATE =
  '[WHERE <feature>, ][WHILE <state>, ][WHEN <trigger>, | IF <trigger>, THEN ]the <system name> SHALL <system response>';

// The statement rules in JAVASCRIPT.md#claim-document-structure.
export function statementErrors(statement, kind, system) {
  const raw = statement.replace(/\s+/g, ' ').trim();
  // Masking keeps offsets, so a position in `text` is the same position in `raw`.
  let text = maskCode(raw);
  if (text === '') {
    return ['must not be empty'];
  }

  const errors = [];
  const shall = text.search(/\bSHALL\b/);
  const name = system?.replace(/\s+/g, ' ').trim();
  let named = false;
  if (shall === -1) {
    errors.push('must contain "SHALL"');
  } else if (!name) {
    errors.push(
      'must name its system before "SHALL", but its claim document has no "#" heading',
    );
  } else if (
    new RegExp(`(^|, |THEN )the ${escapeRegExp(name)} $`, 'i').test(
      raw.slice(0, shall),
    )
  ) {
    // The keyword rules below apply outside the system name.
    const start = shall - name.length - 1;
    text = text.slice(0, start) + 'x'.repeat(name.length) + text.slice(shall - 1);
    named = true;
  } else {
    errors.push(`must name its system as "the ${system}" before "SHALL"`);
  }
  if (
    [...text.matchAll(/\b(?:where|while|when(?:ever)?|if|then|shall)\b/gi)].some(
      ([word]) => word !== word.toUpperCase() || word === 'WHENEVER',
    )
  ) {
    errors.push(
      'must not contain "where", "while", "when", "whenever", "if", "then", or "shall" except as an uppercase keyword',
    );
  }
  // A hyphenated compound such as "read-only" has a fixed placement.
  if (/(?<![\w-])only(?![\w-])/i.test(text)) {
    errors.push('must use "exactly" or "each" in place of "only"');
  }
  if (!named) {
    return errors;
  }
  const match = new RegExp(
    `^(?:WHERE ${SLOT}, )?(?:WHILE ${SLOT}, )?(?:(WHEN) ${SLOT}, |(IF) ${SLOT}, THEN )?[Tt]he x+ SHALL ${SLOT}$`,
  ).exec(text);
  if (!match) {
    errors.push(`must follow "${TEMPLATE}"`);
  } else if (kind === 'invariant' && (match[1] || match[2])) {
    errors.push('must not contain "WHEN" or "IF"');
  } else if (kind === 'scenario' && !match[1] && !match[2]) {
    errors.push('must contain "WHEN <trigger>," or "IF <trigger>, THEN"');
  }
  return errors;
}

export function validatePair({
  claimDocument,
  claimDocumentPath,
  config,
  proof,
  proofPath,
  relative,
}) {
  const errors = [];
  const claimDocumentSectionIds = unique(
    claimDocument.sections.map(({ id }) => id),
  );
  const claimDocumentClaimIds = unique(
    claimDocument.claims.map(({ id }) => id),
  );
  const claimDocumentSections = titledEntries(claimDocument.sections);
  const claimDocumentClaims = titledEntries(claimDocument.claims);

  const duplicateClaimDocumentSections = duplicateIds(
    claimDocument.sections,
  );
  if (duplicateClaimDocumentSections.length > 0) {
    errors.push(
      `${relative(claimDocumentPath)}: duplicate section ids ${formatIds(duplicateClaimDocumentSections)}.`,
    );
  }

  const duplicateClaimDocumentClaims = duplicateIds(claimDocument.claims);
  if (duplicateClaimDocumentClaims.length > 0) {
    errors.push(
      `${relative(claimDocumentPath)}: duplicate ${config.claimSingular} ids ${formatIds(duplicateClaimDocumentClaims)}.`,
    );
  }

  if (claimDocumentSectionIds.length === 0) {
    errors.push(
      `${relative(claimDocumentPath)}: ${config.claimSingular} claim documents must define at least one section heading of the form "## §N ...".`,
    );
  }
  if (claimDocumentClaimIds.length === 0) {
    errors.push(
      `${relative(claimDocumentPath)}: ${config.claimSingular} claim documents must define at least one ${config.claimSingular} heading of the form "### §N.M ...".`,
    );
  }

  for (const sectionId of claimDocumentSectionIds) {
    if (!claimDocumentSections.has(sectionId)) {
      errors.push(
        `${relative(claimDocumentPath)}: section §${sectionId} must declare a nonempty title after its id.`,
      );
    }
  }
  for (const claimId of claimDocumentClaimIds) {
    if (!claimDocumentClaims.has(claimId)) {
      errors.push(
        `${relative(claimDocumentPath)}: ${config.claimSingular} §${claimId} must declare a nonempty title after its id.`,
      );
    }
    const parentId = parentIdOf(claimId);
    if (!claimDocumentSectionIds.includes(parentId)) {
      errors.push(
        `${relative(claimDocumentPath)}: ${config.claimSingular} §${claimId} is missing its parent section §${parentId}.`,
      );
    }
  }
  for (const section of proof.sections) {
    if (section.id && section.title === '') {
      errors.push(
        `${relative(proofPath)}: section proof §${section.id} must declare a nonempty title after its id.`,
      );
    }
    if (!section.id) {
      errors.push(
        `${relative(proofPath)}: describe calls must use an identified section title.`,
      );
    }
  }
  for (const claim of proof.claims) {
    if (claim.id && claim.title === '') {
      errors.push(
        `${relative(proofPath)}: ${config.claimSingular} proof §${claim.id} must declare a nonempty title after its id.`,
      );
    }
    if (!claim.id) {
      errors.push(
        `${relative(proofPath)}: it or test calls must use an identified ${config.claimSingular} title.`,
      );
    }
  }

  const executableSections = proof.sections.filter(
    ({ unprovenBy }) => unprovenBy === null,
  );
  const executableClaims = proof.claims.filter(
    ({ unprovenBy }) => unprovenBy === null,
  );
  const proofSectionIds = unique(
    proof.sections.map(({ id }) => id).filter(Boolean),
  );
  const proofClaimIds = unique(
    proof.claims.map(({ id }) => id).filter(Boolean),
  );
  const executableSectionIds = unique(
    executableSections.map(({ id }) => id).filter(Boolean),
  );
  const executableClaimIds = unique(
    executableClaims.map(({ id }) => id).filter(Boolean),
  );

  const duplicateProofSections = duplicateIds(
    proof.sections.filter(({ id }) => id),
  );
  if (duplicateProofSections.length > 0) {
    errors.push(
      `${relative(proofPath)}: duplicate describe section ids ${formatIds(duplicateProofSections)}.`,
    );
  }

  const missingSections = difference(
    claimDocumentSectionIds,
    executableSectionIds,
  );
  const unknownSections = difference(
    proofSectionIds,
    claimDocumentSectionIds,
  );
  if (missingSections.length > 0) {
    errors.push(
      `${relative(proofPath)}: missing describe coverage for ${formatIds(missingSections)}.`,
    );
  }
  if (unknownSections.length > 0) {
    errors.push(
      `${relative(proofPath)}: unknown section ids ${formatIds(unknownSections)} not declared in ${path.basename(claimDocumentPath)}.`,
    );
  }

  const missingClaims = difference(
    claimDocumentClaimIds,
    executableClaimIds,
  );
  const unknownClaims = difference(proofClaimIds, claimDocumentClaimIds);
  const unprovenClaims = new Map();
  for (const claim of proof.claims) {
    if (claim.id && claim.unprovenBy && !unprovenClaims.has(claim.id)) {
      unprovenClaims.set(claim.id, claim.unprovenBy);
    }
  }
  const stubbedClaims = missingClaims.filter((id) => unprovenClaims.has(id));
  const absentClaims = missingClaims.filter((id) => !unprovenClaims.has(id));

  if (absentClaims.length > 0) {
    errors.push(
      `${relative(proofPath)}: missing ${config.claimSingular} tests for ${formatIds(absentClaims)}.`,
    );
  }
  for (const claimId of stubbedClaims) {
    errors.push(
      `${relative(proofPath)}: ${config.claimSingular} §${claimId} is declared but not proven; its test is a "${unprovenClaims.get(claimId)}" stub that never executes. Write the proof or remove the claim from ${path.basename(claimDocumentPath)}.`,
    );
  }
  if (unknownClaims.length > 0) {
    errors.push(
      `${relative(proofPath)}: unknown ${config.claimSingular} ids ${formatIds(unknownClaims)} not declared in ${path.basename(claimDocumentPath)}.`,
    );
  }

  for (const claim of proof.claims) {
    if (!claim.id) {
      continue;
    }
    const parentId = parentIdOf(claim.id);
    if (claim.parentSectionId !== parentId) {
      errors.push(
        `${relative(proofPath)}: ${config.claimSingular} test §${claim.id} must be nested under describe section §${parentId}.`,
      );
    }
  }

  const proofSectionTitles = groupedTitles(proof.sections);
  const proofClaimTitles = groupedTitles(proof.claims);
  for (const [sectionId, section] of claimDocumentSections) {
    for (const title of proofSectionTitles.get(sectionId) ?? []) {
      if (title !== section.title) {
        errors.push(
          `${relative(proofPath)}: section title mismatch for §${sectionId}.\n` +
            `  md:   ${section.title}\n` +
            `  test: ${title}`,
        );
      }
    }
  }
  for (const [claimId, claim] of claimDocumentClaims) {
    for (const title of proofClaimTitles.get(claimId) ?? []) {
      if (title !== claim.title) {
        errors.push(
          `${relative(proofPath)}: ${config.claimSingular} title mismatch for §${claimId}.\n` +
            `  md:   ${claim.title}\n` +
            `  test: ${title}`,
        );
      }
    }
  }

  return errors;
}
