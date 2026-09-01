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
## §1 Working invariant
### §1.1 Its proof is present
`,
      'working.invariants.test.ts': `
describe('§1 — Working invariant', () => {
  test('§1.1 — Its proof is present', () => {});
});
`,
      'working.scenarios.md': `
## §1 Working scenario
### §1.1 Its proof is present
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
## §1 Broken scenario
### §1.1 Its proof is absent
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
## §1 Broken invariant
### §1.1 Its proof is absent
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

    const invalidFiles = {
      'broken.invariants.md': `
## §1 Broken invariant
### §1.1 Its proof is absent
`,
      'broken.scenarios.md': `
## §1 Broken scenario
### §1.1 Its proof is absent
`,
      'working.scenarios.md': `
## §1 Working scenario
### §1.1 Its proof is present
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

  test('§1.2 — Every named claim document and proof has its counterpart', async () => {
    const result = await runChecker({
      'lone.invariants.md': `
## §1 Lone claim document
### §1.1 Its proof is absent
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
## §1 Module invariant
### §1.1 Its JavaScript proof is accepted
`,
      'module.invariants.test.mjs': `
describe('§1 — Module invariant', () => {
  test('§1.1 — Its JavaScript proof is accepted', () => {});
});
`,
      'module.scenarios.md': `
## §1 Module scenario
### §1.1 Its JavaScript proof is accepted
`,
      'module.scenarios.test.mjs': `
describe('§1 — Module scenario', () => {
  test('§1.1 — Its JavaScript proof is accepted', () => {});
});
`,
      'javascript.invariants.md': `
## §1 JavaScript invariant
### §1.1 Its JavaScript proof is accepted
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
## §1 Exact module title
### §1.1 Exact module claim
`,
      'invalid.scenarios.test.mjs': `
describe('§1 — Exact module title', () => {
  test('§1.1 — Different module claim', () => {});
});
`,
      'invalid.invariants.md': `
## §1 Exact JavaScript title
### §1.1 Exact JavaScript claim
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

    const ambiguous = await runChecker({
      'ambiguous.invariants.md': `
## §1 Ambiguous proof
### §1.1 Exactly one proof format is required
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

  test('§1.4 — Validation covers recognized files throughout the project tree', async () => {
    const result = await runChecker({
      'src/temp/nested.invariants.md': `
## §1 Nested invariant
### §1.1 Ordinary directories are included
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
});

describe('§2 — Claim document structure', () => {
  test('§2.1 — Every claim document declares a complete identifier hierarchy', async () => {
    const result = await runChecker({
      'empty.invariants.md': '# Empty invariants\n',
      'empty.invariants.test.ts': '',
      'structure.invariants.md': `
## §1 Titled section
## §1 Duplicate section
## §2
### §1.1 Titled claim
### §1.1 Duplicate claim
### §2.1
### §3.1 Orphan claim
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
## §1 Fenced examples
### §1.1 Heading-shaped examples remain statement text

The claim can include an example:

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
    expect(fencedExample.stderr).toBe('');
    expect(fencedExample.stdout).toContain(
      'Invariants validation passed for 1 named invariant pair.',
    );
  });

  test('§2.2 — Every proof reproduces the declared structure and titles', async () => {
    const result = await runChecker({
      'shape.invariants.md': `
## §1 First section
### §1.1 First claim
## §2 Second section
### §2.1 Second claim
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
## §1 Ordered behavior
### §1.1 Later follows earlier
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
## §1: Stable title
### §1.1 -- Stable claim
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
## §1 Current structure
### §1.1 Current claim
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
});

describe('§3 — Proof coverage', () => {
  test('§3.1 — Every declared section has proof coverage', async () => {
    const result = await runChecker({
      'sections.invariants.md': `
## §1 First section
### §1.1 First claim
## §2 Second section
### §2.1 Second claim
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

  test('§3.2 — Every claim has at least one executable proof', async () => {
    const invalid = await runChecker({
      'execution.invariants.md': `
## §1 Execution
### §1.1 Missing proof
### §1.2 Skipped proof
### §1.3 Pending proof
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
## §1 Repeated proof
### §1.1 Multiple tests prove the claim
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
  test('§4.1 — Failure output includes every detected semantic mismatch', async () => {
    const result = await runChecker({
      'missing-proof.invariants.md': `
## §1 Missing proof
### §1.1 The proof is absent
`,
      'missing-claim-document.scenarios.test.ts': `
describe('§1 — Missing claim document', () => {
  test('§1.1 — The claim document is absent', () => {});
});
`,
      'wrong-title.invariants.md': `
## §1 Exact title
### §1.1 Expected wording
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
## §1 First invariant
### §1.1 First proof
`,
      'first.invariants.test.ts': `
describe('§1 — First invariant', () => {
  test('§1.1 — First proof', () => {});
});
`,
      'second.invariants.md': `
## §1 Second invariant
### §1.1 Second proof
`,
      'second.invariants.test.ts': `
describe('§1 — Second invariant', () => {
  test('§1.1 — Second proof', () => {});
});
`,
      'ordered.scenarios.md': `
## §1 Ordered behavior
### §1.1 Later follows earlier
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

  test('§4.3 — The checker process succeeds only when selected validation passes', async () => {
    const valid = await runChecker(
      {
        'valid.invariants.md': `
## §1 Valid invariant
### §1.1 Its proof is present
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
## §1 Mismatched invariant
### §1.1 Its proof is absent
`,
      },
      ['invariants'],
    );
    expect(mismatch.exitCode).not.toBe(0);

    const unsupported = await runChecker({}, ['unknown']);
    expect(unsupported.exitCode).not.toBe(0);
  });
});
