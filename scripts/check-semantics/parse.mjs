const SECTION_ID_RE = /^§([0-9]+)(?![0-9.])\b/;
const CLAIM_ID_RE = /^§([0-9]+(?:\.[0-9]+)+)\b/;
const SECTION_TITLE_RE =
  /^§([0-9]+)(?![0-9.])(?:\s*(?:—|--|-|–|:)\s*|\s+)(.*?)\s*$/;
const CLAIM_TITLE_RE =
  /^§([0-9]+(?:\.[0-9]+)+)(?:\s*(?:—|--|-|–|:)\s*|\s+)(.*?)\s*$/;

export function parseSectionTitle(title) {
  return parseTitle(title, SECTION_ID_RE, SECTION_TITLE_RE);
}

export function parseClaimTitle(title) {
  return parseTitle(title, CLAIM_ID_RE, CLAIM_TITLE_RE);
}

function parseTitle(title, idPattern, titlePattern) {
  if (title === null) {
    return null;
  }

  const id = title.match(idPattern)?.[1];
  if (!id) {
    return null;
  }

  return {
    id,
    title: title.match(titlePattern)?.[2].trim() ?? '',
  };
}

export function parseClaimDocument(source) {
  const sections = [];
  const claims = [];
  let documentTitle = null;
  let fence = null;
  let pendingClaim = null;

  function finishClaim() {
    if (!pendingClaim) {
      return;
    }
    pendingClaim.statement = pendingClaim.statementLines
      .join('\n')
      .trim();
    delete pendingClaim.statementLines;
    claims.push(pendingClaim);
    pendingClaim = null;
  }

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const delimiter = fenceMatch[1];
      if (!fence) {
        fence = { character: delimiter[0], length: delimiter.length };
      } else if (
        delimiter[0] === fence.character &&
        delimiter.length >= fence.length &&
        fenceMatch[2].trim() === ''
      ) {
        fence = null;
      }
      if (pendingClaim) {
        pendingClaim.statementLines.push(line);
      }
      continue;
    }

    if (fence) {
      if (pendingClaim) {
        pendingClaim.statementLines.push(line);
      }
      continue;
    }

    const documentHeading = line.match(/^#\s+(.+)$/)?.[1];
    if (documentHeading && documentTitle === null) {
      documentTitle = documentHeading.trim();
      continue;
    }

    const sectionHeading = line.match(/^##\s+(.+)$/)?.[1];
    if (sectionHeading) {
      finishClaim();
      const section = parseSectionTitle(sectionHeading);
      if (section) {
        sections.push({ ...section, line: index + 1 });
      }
      continue;
    }

    const claimHeading = line.match(/^###\s+(.+)$/)?.[1];
    if (claimHeading) {
      finishClaim();
      const claim = parseClaimTitle(claimHeading);
      if (claim) {
        pendingClaim = {
          ...claim,
          line: index + 1,
          statementLines: [],
        };
      }
      continue;
    }

    if (pendingClaim) {
      pendingClaim.statementLines.push(line);
    }
  }

  finishClaim();
  return { claims, documentTitle, sections };
}

function getCallRootName(expression, ts) {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression)
  ) {
    return getCallRootName(expression.expression, ts);
  }
  if (ts.isCallExpression(expression)) {
    return getCallRootName(expression.expression, ts);
  }
  if (ts.isParenthesizedExpression(expression)) {
    return getCallRootName(expression.expression, ts);
  }
  return null;
}

function getStringLiteralText(node, ts) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.trim();
  }
  return null;
}

function isEachFactoryCall(expression, ts) {
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text === 'each';
  }
  if (ts.isElementAccessExpression(expression)) {
    return getStringLiteralText(expression.argumentExpression, ts) === 'each';
  }
  return false;
}

function collectModifiers(expression, ts, modifiers = []) {
  if (ts.isPropertyAccessExpression(expression)) {
    modifiers.push(expression.name.text);
    return collectModifiers(expression.expression, ts, modifiers);
  }
  if (ts.isElementAccessExpression(expression)) {
    const modifier = getStringLiteralText(expression.argumentExpression, ts);
    if (modifier !== null) {
      modifiers.push(modifier);
    }
    return collectModifiers(expression.expression, ts, modifiers);
  }
  if (ts.isCallExpression(expression)) {
    return collectModifiers(expression.expression, ts, modifiers);
  }
  if (ts.isParenthesizedExpression(expression)) {
    return collectModifiers(expression.expression, ts, modifiers);
  }
  return modifiers;
}

function findUnprovenModifier(expression, ts) {
  return (
    collectModifiers(expression, ts).find(
      (modifier) => modifier === 'skip' || modifier === 'todo',
    ) ?? null
  );
}

export function parseProof(sourceFile, ts) {
  const sections = [];
  const claims = [];

  function visit(node, sectionStack, inheritedUnprovenBy) {
    if (ts.isCallExpression(node)) {
      const callName = getCallRootName(node.expression, ts);
      if (callName === 'describe' || callName === 'it' || callName === 'test') {
        const rawTitle = node.arguments[0]
          ? getStringLiteralText(node.arguments[0], ts)
          : null;
        const unprovenBy =
          inheritedUnprovenBy ??
          findUnprovenModifier(node.expression, ts);
        const line =
          sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          ).line + 1;

        if (rawTitle === null && isEachFactoryCall(node.expression, ts)) {
          node.forEachChild((child) =>
            visit(child, sectionStack, inheritedUnprovenBy),
          );
          return;
        }

        if (callName === 'describe') {
          const parsed = parseSectionTitle(rawTitle);
          sections.push({
            id: parsed?.id ?? null,
            line,
            title: parsed?.title ?? null,
            unprovenBy,
          });
          node.forEachChild((child) =>
            visit(child, [...sectionStack, parsed?.id ?? null], unprovenBy),
          );
          return;
        }

        const parsed = parseClaimTitle(rawTitle);
        claims.push({
          id: parsed?.id ?? null,
          line,
          parentSectionId: sectionStack.at(-1) ?? null,
          title: parsed?.title ?? null,
          unprovenBy,
        });
      }
    }

    node.forEachChild((child) =>
      visit(child, sectionStack, inheritedUnprovenBy),
    );
  }

  visit(sourceFile, [], null);
  return { claims, sections };
}
