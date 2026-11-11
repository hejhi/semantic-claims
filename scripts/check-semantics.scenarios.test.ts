import { describe, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKER = fileURLToPath(
  new URL('./check-semantics.mjs', import.meta.url),
);

type RunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

async function writeFixture(
  files: Record<string, string>,
): Promise<string> {
  const root = await mkdtemp(
    path.join(tmpdir(), 'semantic-claims-checker-'),
  );

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }

  return root;
}

async function runChecker(
  files: Record<string, string>,
  modes: string[] = [],
): Promise<RunResult> {
  const root = await writeFixture(files);

  try {
    const child = Bun.spawn({
      cmd: [process.execPath, CHECKER, ...modes],
      cwd: root,
      stderr: 'pipe',
      stdout: 'pipe',
    });
    const [exitCode, stderr, stdout] = await Promise.all([
      child.exited,
      new Response(child.stderr).text(),
      new Response(child.stdout).text(),
    ]);
    return { exitCode, stderr, stdout };
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe('§1 — Validation scope', () => {
  test('§1.1 — Supported kind selections determine validation scope', async () => {
    const validFiles = {
      'working.invariants.md': `
# Subject
## §1 Working invariant
### §1.1 Its proof is present
The subject SHALL return a value.
`,
      'working.invariants.test.ts': `
describe('§1 — Working invariant', () => {
  test('§1.1 — Its proof is present', () => {});
});
`,
      'working.scenarios.md': `
# Subject
## §1 Working scenario
### §1.1 Its proof is present
WHEN the subject runs, the subject SHALL return a value.
`,
      'working.scenarios.test.ts': `
describe('§1 — Working scenario', () => {
  test('§1.1 — Its proof is present', () => {});
});
`,
    };

    const bothByDefault = await runChecker(validFiles);
    expect(bothByDefault.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );
    expect(bothByDefault.stdout).toContain(
      'Scenarios validation passed for 1 named scenario pair.',
    );

    const invariantsOnly = await runChecker(
      {
        ...validFiles,
        'broken.scenarios.md': `
# Subject
## §1 Broken scenario
### §1.1 Its proof is absent
WHEN the subject runs, the subject SHALL return a value.
`,
      },
      ['invariants'],
    );
    expect(invariantsOnly.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );
    expect(invariantsOnly.stdout).not.toContain('Scenarios');
    expect(invariantsOnly.stderr).not.toContain('broken.scenarios.md');

    const scenariosOnly = await runChecker(
      {
        ...validFiles,
        'broken.invariants.md': `
# Subject
## §1 Broken invariant
### §1.1 Its proof is absent
The subject SHALL return a value.
`,
      },
      ['scenarios'],
    );
    expect(scenariosOnly.stdout).toContain(
      'Scenarios validation passed for 1 named scenario pair.',
    );
    expect(scenariosOnly.stdout).not.toContain('Invariants');
    expect(scenariosOnly.stderr).not.toContain('broken.invariants.md');

    const bothSelected = await runChecker(validFiles, [
      'scenarios',
      'invariants',
    ]);
    expect(bothSelected.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );
    expect(bothSelected.stdout).toContain(
      'Scenarios validation passed for 1 named scenario pair.',
    );
  });

  test('§1.2 — A checked file without its counterpart fails validation', async () => {
    const result = await runChecker({
      'lone.invariants.md': `
# Subject
## §1 Lone claim document
### §1.1 Its proof is absent
The subject SHALL return a value.
`,
      'orphan.scenarios.test.ts': `
describe('§1 — Orphan proof', () => {
  test('§1.1 — Its claim document is absent', () => {});
});
`,
    });

    expect(result.stderr).toContain(
      'lone.invariants.md: expected paired test file',
    );
    expect(result.stderr).toContain(
      'orphan.scenarios.test.ts: expected paired scenario claim document orphan.scenarios.md',
    );
  });

  test('§1.3 — TypeScript tests and JavaScript modules are equivalent proof formats', async () => {
    const modules = await runChecker({
      'module.invariants.md': `
# Subject
## §1 Module invariant
### §1.1 Its JavaScript proof is accepted
The subject SHALL return a value.
`,
      'module.invariants.test.mjs': `
describe('§1 — Module invariant', () => {
  test('§1.1 — Its JavaScript proof is accepted', () => {});
});
`,
      'module.scenarios.md': `
# Subject
## §1 Module scenario
### §1.1 Its JavaScript proof is accepted
WHEN the subject runs, the subject SHALL return a value.
`,
      'module.scenarios.test.mjs': `
describe('§1 — Module scenario', () => {
  test('§1.1 — Its JavaScript proof is accepted', () => {});
});
`,
      'javascript.invariants.md': `
# Subject
## §1 JavaScript invariant
### §1.1 Its JavaScript proof is accepted
The subject SHALL return a value.
`,
      'javascript.invariants.test.js': `
describe('§1 — JavaScript invariant', () => {
  test('§1.1 — Its JavaScript proof is accepted', () => {});
});
`,
    });

    expect(modules.stdout).toContain(
      'Invariants validation passed for 2 named invariant pairs.',
    );
    expect(modules.stdout).toContain(
      'Scenarios validation passed for 1 named scenario pair.',
    );

    const invalidModule = await runChecker({
      'invalid.scenarios.md': `
# Subject
## §1 Exact module title
### §1.1 Exact module claim
WHEN the subject runs, the subject SHALL return a value.
`,
      'invalid.scenarios.test.mjs': `
describe('§1 — Exact module title', () => {
  test('§1.1 — Different module claim', () => {});
});
`,
      'invalid.invariants.md': `
# Subject
## §1 Exact JavaScript title
### §1.1 Exact JavaScript claim
The subject SHALL return a value.
`,
      'invalid.invariants.test.js': `
describe('§1 — Exact JavaScript title', () => {
  test('§1.1 — Different JavaScript claim', () => {});
});
`,
    });
    expect(invalidModule.stderr).toContain(
      'invalid.scenarios.test.mjs: scenario title mismatch for §1.1',
    );
    expect(invalidModule.stderr).toContain(
      'invalid.invariants.test.js: invariant title mismatch for §1.1',
    );
  });

  test('§1.5 — A claim document with multiple paired proof files fails validation', async () => {
    const ambiguous = await runChecker({
      'ambiguous.invariants.md': `
# Subject
## §1 Ambiguous proof
### §1.1 Exactly one proof format is required
The subject SHALL return a value.
`,
      'ambiguous.invariants.test.ts': `
describe('§1 — Ambiguous proof', () => {
  test('§1.1 — Exactly one proof format is required', () => {});
});
`,
      'ambiguous.invariants.test.mjs': `
describe('§1 — Ambiguous proof', () => {
  test('§1.1 — Exactly one proof format is required', () => {});
});
`,
      'ambiguous.invariants.test.js': `
describe('§1 — Ambiguous proof', () => {
  test('§1.1 — Exactly one proof format is required', () => {});
});
`,
    });

    expect(ambiguous.stderr).toContain(
      'ambiguous.invariants.md: multiple paired test files',
    );
    expect(ambiguous.stderr).toContain('ambiguous.invariants.test.ts');
    expect(ambiguous.stderr).toContain('ambiguous.invariants.test.mjs');
    expect(ambiguous.stderr).toContain('ambiguous.invariants.test.js');
  });

  test('§1.1 — Supported kind selections determine validation scope', async () => {
    const result = await runChecker({
      'src/temp/nested.invariants.md': `
# Subject
## §1 Nested invariant
### §1.1 Ordinary directories are included
The subject SHALL return a value.
`,
      'src/temp/nested.invariants.test.mjs': `
describe('§1 — Nested invariant', () => {
  test('§1.1 — Ordinary directories are included', () => {});
});
`,
      '.hidden/ignored.invariants.md': '## §1 Ignored\n### §1.1 No proof\n',
      'node_modules/dependency/ignored.invariants.md':
        '## §1 Ignored\n### §1.1 No proof\n',
      'dist/ignored.invariants.md': '## §1 Ignored\n### §1.1 No proof\n',
      'coverage/ignored.invariants.md':
        '## §1 Ignored\n### §1.1 No proof\n',
    });

    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );
  });

  test('§1.4 — An unsupported argument list is rejected', async () => {
    const invalidFiles = {
      'broken.invariants.md': `
# Subject
## §1 Broken invariant
### §1.1 Its proof is absent
The subject SHALL return a value.
`,
      'broken.scenarios.md': `
# Subject
## §1 Broken scenario
### §1.1 Its proof is absent
WHEN the subject runs, the subject SHALL return a value.
`,
      'working.scenarios.md': `
# Subject
## §1 Working scenario
### §1.1 Its proof is present
WHEN the subject runs, the subject SHALL return a value.
`,
      'working.scenarios.test.ts': `
describe('§1 — Working scenario', () => {
  test('§1.1 — Its proof is present', () => {});
});
`,
    };

    const unsupported = await runChecker(invalidFiles, ['unknown']);
    expect(unsupported.stderr).toContain(
      'Usage: semantic-claims [invariants] [scenarios]',
    );
    expect(unsupported.stdout).not.toContain('validation passed');
    expect(unsupported.stderr).not.toContain(
      'broken.scenarios.md: expected paired test file',
    );

    const mixed = await runChecker(invalidFiles, [
      'scenarios',
      'unknown',
    ]);
    expect(mixed.stderr).toContain(
      'Usage: semantic-claims [invariants] [scenarios]',
    );
    expect(mixed.stdout).not.toContain('validation passed');
    expect(mixed.stderr).not.toContain(
      'broken.scenarios.md: expected paired test file',
    );
  });
});

describe('§2 — Claim document structure', () => {
  test('§2.1 — An incomplete identifier hierarchy fails validation', async () => {
    const result = await runChecker({
      'empty.invariants.md': '# Empty invariants\n',
      'empty.invariants.test.ts': '',
      'structure.invariants.md': `
# Subject
## §1 Titled section
## §1 Duplicate section
## §2
### §1.1 Titled claim
The subject SHALL return a value.
### §1.1 Duplicate claim
The subject SHALL return a value.
### §2.1
The subject SHALL return a value.
### §3.1 Orphan claim
The subject SHALL return a value.
`,
      'structure.invariants.test.ts': '',
    });

    expect(result.stderr).toContain(
      'empty.invariants.md: invariant claim documents must declare § ids',
    );
    expect(result.stderr).toContain(
      'structure.invariants.md: duplicate section ids §1',
    );
    expect(result.stderr).toContain(
      'structure.invariants.md: duplicate invariant ids §1.1',
    );
    expect(result.stderr).toContain(
      'structure.invariants.md: section §2 must declare a nonempty title',
    );
    expect(result.stderr).toContain(
      'structure.invariants.md: invariant §2.1 must declare a nonempty title',
    );
    expect(result.stderr).toContain(
      'structure.invariants.md: invariant §3.1 is missing its parent section §3',
    );

    const fencedExample = await runChecker({
      'fenced.invariants.md': `
# Subject
## §1 Fenced examples
### §1.1 Heading-shaped examples remain statement text

The subject SHALL include an example:

\`\`\`md
## §8 Backtick example section
### §8.1 Backtick example claim
\`\`\`

~~~md
## §9 Tilde example section
### §9.1 Tilde example claim
~~~

## §2 Later real section
### §2.1 Later real claim remains visible
The subject SHALL return a value.
`,
      'fenced.invariants.test.ts': `
describe('§1 — Fenced examples', () => {
  test('§1.1 — Heading-shaped examples remain statement text', () => {});
});
describe('§2 — Later real section', () => {
  test('§2.1 — Later real claim remains visible', () => {});
});
`,
    });
    // The backtick fence lines are the only errors, so neither fence adds a section or claim.
    expect(fencedExample.stderr).toBe(
      'Semantic claim validation failed:\n\n- fenced.invariants.md: lines 8, 11 must not contain a backtick.\n',
    );
  });

  test('§2.2 — A proof that differs from the structure of its claim document fails validation', async () => {
    const result = await runChecker({
      'shape.invariants.md': `
# Subject
## §1 First section
### §1.1 First claim
The subject SHALL return a value.
## §2 Second section
### §2.1 Second claim
The subject SHALL return a value.
`,
      'shape.invariants.test.ts': `
describe('§1 — Renamed first section', () => {
  test('§1.1 — Renamed first claim', () => {});
  test('§2.1 — Second claim', () => {});
  test('§1.2 — Unknown claim', () => {});
  test('§1.3', () => {});
  test('Unidentified proof', () => {});
});
describe('§2 — Second section', () => {
  test('§2.1 — Second claim', () => {});
});
describe('Unidentified section', () => {});
`,
      'shape.scenarios.md': `
# Subject
## §1 Ordered behavior
### §1.1 Later follows earlier
WHEN the subject runs, the subject SHALL return a value.
`,
      'shape.scenarios.test.ts': `
describe('§1 — Reordered behavior', () => {
  test('§1.1 — Earlier follows later', () => {});
});
`,
    });

    expect(result.stderr).toContain(
      'shape.invariants.test.ts: it or test calls must use an identified invariant title',
    );
    expect(result.stderr).toContain(
      'shape.invariants.test.ts: describe calls must use an identified section title',
    );
    expect(result.stderr).toContain(
      'shape.invariants.test.ts: unknown invariant ids §1.2, §1.3',
    );
    expect(result.stderr).toContain(
      'shape.invariants.test.ts: invariant test §2.1 must be nested under describe section §2',
    );
    expect(result.stderr).toContain(
      'shape.invariants.test.ts: section title mismatch for §1',
    );
    expect(result.stderr).toContain(
      'shape.invariants.test.ts: invariant title mismatch for §1.1',
    );
    expect(result.stderr).toContain(
      'shape.invariants.test.ts: invariant proof §1.3 must declare a nonempty title',
    );
    expect(result.stderr).toContain(
      'shape.scenarios.test.ts: section title mismatch for §1',
    );
    expect(result.stderr).toContain(
      'shape.scenarios.test.ts: scenario title mismatch for §1.1',
    );

    const structuralSeparators = await runChecker({
      'separators.invariants.md': `
# Subject
## §1: Stable title
### §1.1 -- Stable claim
The subject SHALL return a value.
`,
      'separators.invariants.test.ts': `
describe('§1 — Stable title', () => {
  test('§1.1 - Stable claim', () => {});
});
`,
    });
    expect(structuralSeparators.stderr).toBe('');
    expect(structuralSeparators.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );

    const disabledStructure = await runChecker({
      'disabled.invariants.md': `
# Subject
## §1 Current structure
### §1.1 Current claim
The subject SHALL return a value.
`,
      'disabled.invariants.test.ts': `
describe('§1 — Current structure', () => {
  test('§1.1 — Current claim', () => {});
  test.skip('§1.1 — Stale disabled title', () => {});
  test.skip('§9.1 — Unknown disabled claim', () => {});
});
describe.skip('§9 — Unknown disabled section', () => {});
`,
    });
    expect(disabledStructure.stderr).toContain(
      'unknown section ids §9',
    );
    expect(disabledStructure.stderr).toContain(
      'unknown invariant ids §9.1',
    );
    expect(disabledStructure.stderr).toContain(
      'invariant title mismatch for §1.1',
    );
  });

  test('§2.3 — A statement that breaks a statement rule fails validation', async () => {
    const valid = await runChecker({
      'valid.invariants.md': `
# Range
## §1 Valid invariant patterns
### §1.1 Ubiquitous
The range SHALL include both endpoints.
### §1.2 State driven
WHILE empty, the range SHALL report the range as empty.
### §1.3 Optional feature
WHERE the range is exclusive, the range SHALL exclude its upper endpoint.
### §1.5 Optional feature and state
WHERE the range is exclusive, WHILE empty, the range SHALL report the range as empty.
`,
      'valid.invariants.test.ts': `
describe('§1 — Valid invariant patterns', () => {
  test('§1.1 — Ubiquitous', () => {});
  test('§1.2 — State driven', () => {});
  test('§1.3 — Optional feature', () => {});
  test('§1.5 — Optional feature and state', () => {});
});
`,
      'keyword.invariants.md': `
# When view
## §1 Keyword in the system name
### §1.1 Ubiquitous
The when view SHALL render its fallback.
`,
      'keyword.invariants.test.ts': `
describe('§1 — Keyword in the system name', () => {
  test('§1.1 — Ubiquitous', () => {});
});
`,
      'valid.scenarios.md': `
# Session service
## §1 Valid scenario patterns
### §1.1 Event driven
WHEN a request presents an expired credential, the session service SHALL reject the request as unauthenticated.
### §1.2 Unwanted behavior
IF a write fails, THEN the session service SHALL keep the previous session.
### §1.3 Complex
WHILE the session service is paused, WHEN a request arrives, the session service SHALL reject the request as unavailable.
### §1.4 Optional feature and event
WHERE the session service is read-only, WHEN a write arrives, the session service SHALL reject the write.
`,
      'valid.scenarios.test.ts': `
describe('§1 — Valid scenario patterns', () => {
  test('§1.1 — Event driven', () => {});
  test('§1.2 — Unwanted behavior', () => {});
  test('§1.3 — Complex', () => {});
  test('§1.4 — Optional feature and event', () => {});
});
`,
    });
    expect(valid.stderr).toBe('');
    expect(valid.stdout).toContain(
      'Invariants validation passed for 2 named invariant pairs.',
    );
    expect(valid.stdout).toContain(
      'Scenarios validation passed for 1 named scenario pair.',
    );

    const invalid = await runChecker({
      'invalid.invariants.md': `
# View
## §1 Invalid invariant patterns
### §1.1 Missing SHALL
A value equal to either endpoint is included.
### §1.2 Event in an invariant
The view SHALL keep the value it had when the modal opened.
### §1.3 Lowercase keyword
While open, the view SHALL keep its value.
### §1.4 Empty statement
### §1.5 Trigger in an invariant
WHEN opened, the view SHALL show its value.
### §1.6 Recurring event in an invariant
The view SHALL refresh whenever the value changes.
### §1.7 Another system
The parser SHALL return a value.
### §1.8 A returned value as the system
The size of the view SHALL be positive.
### §1.9 Clauses out of order
WHILE empty, WHERE exclusive, the view SHALL show nothing.
`,
      'invalid.invariants.test.ts': `
describe('§1 — Invalid invariant patterns', () => {
  test('§1.1 — Missing SHALL', () => {});
  test('§1.2 — Event in an invariant', () => {});
  test('§1.3 — Lowercase keyword', () => {});
  test('§1.4 — Empty statement', () => {});
  test('§1.5 — Trigger in an invariant', () => {});
  test('§1.6 — Recurring event in an invariant', () => {});
  test('§1.7 — Another system', () => {});
  test('§1.8 — A returned value as the system', () => {});
  test('§1.9 — Clauses out of order', () => {});
});
`,
      'invalid.scenarios.md': `
# Modal
## §1 Invalid scenario patterns
### §1.1 Missing trigger
The modal SHALL report its state.
### §1.2 State without trigger
WHILE open, the modal SHALL contain the focused element.
### §1.3 Unwanted event without THEN
IF a write throws, the modal SHALL keep the previous output attached.
### §1.4 Trigger after SHALL
WHILE open, the modal SHALL close, WHEN Escape is pressed.
### §1.5 State after the trigger
WHEN Escape is pressed, while open, the modal SHALL close.
### §1.6 Keyword as prose in the response
WHEN Escape is pressed, the modal SHALL close if and only if it is open.
### §1.7 Placement-dependent word
WHEN Escape is pressed, the modal SHALL close only the top dialog.
`,
      'invalid.scenarios.test.ts': `
describe('§1 — Invalid scenario patterns', () => {
  test('§1.1 — Missing trigger', () => {});
  test('§1.2 — State without trigger', () => {});
  test('§1.3 — Unwanted event without THEN', () => {});
  test('§1.4 — Trigger after SHALL', () => {});
  test('§1.5 — State after the trigger', () => {});
  test('§1.6 — Keyword as prose in the response', () => {});
  test('§1.7 — Placement-dependent word', () => {});
});
`,
      'unpaired.invariants.md': `
## §1 Unpaired
### §1.1 Missing SHALL
A value equal to either endpoint is included.
`,
      'keyword.invariants.md': `
# When view
## §1 Keyword outside the system name
### §1.1 Event in an invariant
The when view SHALL render when ready.
`,
      'keyword.invariants.test.ts': `
describe('§1 — Keyword outside the system name', () => {
  test('§1.1 — Event in an invariant', () => {});
});
`,
      'headless.invariants.md': `
## §1 No heading
### §1.1 Unnamed system
The subject SHALL return a value.
`,
      'headless.invariants.test.ts': `
describe('§1 — No heading', () => {
  test('§1.1 — Unnamed system', () => {});
});
`,
    });
    const template =
      'must follow "[WHERE <creation value>, ][WHILE <state>, ][WHEN <trigger>, | IF <trigger>, THEN ]the <system name> SHALL <system response>".';
    const keyword =
      'must not contain "where", "while", "when", "whenever", "if", "then", or "shall" except as an uppercase keyword.';
    expect(invalid.exitCode).not.toBe(0);
    expect(invalid.stderr).not.toContain('invariant §1.2 statement must name');
    for (const message of [
      'invalid.invariants.md: invariant §1.1 statement must contain "SHALL".',
      `invalid.invariants.md: invariant §1.2 statement ${keyword}`,
      `invalid.invariants.md: invariant §1.3 statement ${keyword}`,
      `invalid.invariants.md: invariant §1.3 statement ${template}`,
      'invalid.invariants.md: invariant §1.4 statement must not be empty.',
      'invalid.invariants.md: invariant §1.5 statement must not contain "WHEN" or "IF".',
      `invalid.invariants.md: invariant §1.6 statement ${keyword}`,
      'invalid.invariants.md: invariant §1.7 statement must name its system as "the View" before "SHALL".',
      'invalid.invariants.md: invariant §1.8 statement must name its system as "the View" before "SHALL".',
      `invalid.invariants.md: invariant §1.9 statement ${template}`,
      'invalid.scenarios.md: scenario §1.1 statement must contain "WHEN <trigger>," or "IF <trigger>, THEN".',
      'invalid.scenarios.md: scenario §1.2 statement must contain "WHEN <trigger>," or "IF <trigger>, THEN".',
      `invalid.scenarios.md: scenario §1.3 statement ${template}`,
      `invalid.scenarios.md: scenario §1.4 statement ${template}`,
      `invalid.scenarios.md: scenario §1.5 statement ${keyword}`,
      `invalid.scenarios.md: scenario §1.6 statement ${keyword}`,
      'invalid.scenarios.md: scenario §1.7 statement must use "exactly" or "each" in place of "only".',
      'unpaired.invariants.md: invariant §1.1 statement must contain "SHALL".',
      'headless.invariants.md: invariant §1.1 statement must name its system before "SHALL", but its claim document has no "#" heading.',
      `keyword.invariants.md: invariant §1.1 statement ${keyword}`,
    ]) {
      expect(invalid.stderr).toContain(message);
    }
  });

  test('§2.4 — A claim document with a backtick fails validation', async () => {
    const result = await runChecker({
      'code.invariants.md': `# View
The view shows a \`value\`.
## §1 The \`value\` section
### §1.1 The \`value\` claim
The view SHALL show the \`value\`.
`,
      'code.invariants.test.ts': `
describe('§1 — The \`value\` section', () => {
  test('§1.1 — The \`value\` claim', () => {});
});
`,
      'plain.invariants.md': `# View
## §1 Plain section
### §1.1 Plain claim
The view SHALL show the value.
`,
      'plain.invariants.test.ts': `
describe('§1 — Plain section', () => {
  test('§1.1 — Plain claim', () => {});
});
`,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain(
      'code.invariants.md: lines 2, 3, 4, 5 must not contain a backtick.',
    );
    expect(result.stderr).not.toContain('plain.invariants.md');
  });
});

describe('§3 — Proof coverage', () => {
  test('§3.1 — A section without exactly one matching test group fails validation', async () => {
    const result = await runChecker({
      'sections.invariants.md': `
# Subject
## §1 First section
### §1.1 First claim
The subject SHALL return a value.
## §2 Second section
### §2.1 Second claim
The subject SHALL return a value.
`,
      'sections.invariants.test.ts': `
describe('§1 — First section', () => {
  test('§1.1 — First claim', () => {});
});
describe('§1 — First section', () => {
  test('§1.1 — First claim', () => {});
});
`,
    });

    expect(result.stderr).toContain(
      'sections.invariants.test.ts: duplicate describe section ids §1',
    );
    expect(result.stderr).toContain(
      'sections.invariants.test.ts: missing describe coverage for §2',
    );
  });

  test('§3.2 — Exactly the claims without an executable proof are reported as missing', async () => {
    const invalid = await runChecker({
      'execution.invariants.md': `
# Subject
## §1 Execution
### §1.1 Missing proof
The subject SHALL return a value.
### §1.2 Skipped proof
The subject SHALL return a value.
### §1.3 Pending proof
The subject SHALL return a value.
`,
      'execution.invariants.test.ts': `
describe('§1 — Execution', () => {
  test.skip('§1.2 — Skipped proof', () => {});
  test.todo('§1.3 — Pending proof');
});
`,
    });

    expect(invalid.stderr).toContain(
      'execution.invariants.test.ts: missing invariant tests for §1.1',
    );
    expect(invalid.stderr).toContain(
      'invariant §1.2 is declared but not proven; its test is a "skip" stub',
    );
    expect(invalid.stderr).toContain(
      'invariant §1.3 is declared but not proven; its test is a "todo" stub',
    );

    const repeated = await runChecker({
      'repeated.invariants.md': `
# Subject
## §1 Repeated proof
### §1.1 Multiple tests prove the claim
The subject SHALL return a value.
`,
      'repeated.invariants.test.ts': `
describe.each([1])('§1 — Repeated proof', () => {
  test.each([1, 2])('§1.1 — Multiple tests prove the claim', () => {});
});
`,
    });

    expect(repeated.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );
  });
});

describe('§4 — Validation results', () => {
  test('§4.1 — Failure output names each invalid checked file', async () => {
    const result = await runChecker({
      'missing-proof.invariants.md': `
# Subject
## §1 Missing proof
### §1.1 The proof is absent
The subject SHALL return a value.
`,
      'missing-claim-document.scenarios.test.ts': `
describe('§1 — Missing claim document', () => {
  test('§1.1 — The claim document is absent', () => {});
});
`,
      'wrong-title.invariants.md': `
# Subject
## §1 Exact title
### §1.1 Expected wording
The subject SHALL return a value.
`,
      'wrong-title.invariants.test.ts': `
describe('§1 — Exact title', () => {
  test('§1.1 — Different wording', () => {});
});
`,
    });

    expect(result.stderr).toContain('Semantic claim validation failed:');
    expect(result.stderr).toContain('missing-proof.invariants.md');
    expect(result.stderr).toContain(
      'missing-claim-document.scenarios.test.ts',
    );
    expect(result.stderr).toContain('wrong-title.invariants.test.ts');
    expect(result.stderr).toContain('invariant title mismatch for §1.1');
    expect(result.stderr).toContain('md:   Expected wording');
    expect(result.stderr).toContain('test: Different wording');
  });

  test('§4.2 — Success output includes the number of checked pairs', async () => {
    const result = await runChecker({
      'first.invariants.md': `
# Subject
## §1 First invariant
### §1.1 First proof
The subject SHALL return a value.
`,
      'first.invariants.test.ts': `
describe('§1 — First invariant', () => {
  test('§1.1 — First proof', () => {});
});
`,
      'second.invariants.md': `
# Subject
## §1 Second invariant
### §1.1 Second proof
The subject SHALL return a value.
`,
      'second.invariants.test.ts': `
describe('§1 — Second invariant', () => {
  test('§1.1 — Second proof', () => {});
});
`,
      'ordered.scenarios.md': `
# Subject
## §1 Ordered behavior
### §1.1 Later follows earlier
WHEN the subject runs, the subject SHALL return a value.
`,
      'ordered.scenarios.test.ts': `
describe('§1 — Ordered behavior', () => {
  test('§1.1 — Later follows earlier', () => {});
});
`,
    });

    expect(result.stdout).toContain(
      'Invariants validation passed for 2 named invariant pairs.',
    );
    expect(result.stdout).toContain(
      'Scenarios validation passed for 1 named scenario pair.',
    );
    expect(result.stderr).toBe('');
  });

  test('§4.3 — The checker reports success for a valid project', async () => {
    const valid = await runChecker(
      {
        'valid.invariants.md': `
# Subject
## §1 Valid invariant
### §1.1 Its proof is present
The subject SHALL return a value.
`,
        'valid.invariants.test.ts': `
describe('§1 — Valid invariant', () => {
  test('§1.1 — Its proof is present', () => {});
});
`,
      },
      ['invariants'],
    );
    expect(valid.exitCode).toBe(0);

    const mismatch = await runChecker(
      {
        'mismatch.invariants.md': `
# Subject
## §1 Mismatched invariant
### §1.1 Its proof is absent
The subject SHALL return a value.
`,
      },
      ['invariants'],
    );
    expect(mismatch.exitCode).not.toBe(0);

    const unsupported = await runChecker({}, ['unknown']);
    expect(unsupported.exitCode).not.toBe(0);
  });
});
