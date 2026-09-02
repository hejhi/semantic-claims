#!/usr/bin/env node

import { spawn } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_FILES = [
  '.agents/skills/semantic-claims/SKILL.md',
  '.agents/skills/semantic-claims/agents/openai.yaml',
  '.agents/skills/semantic-claims/references/EXAMPLES.md',
  '.agents/skills/semantic-claims/references/FAQ.md',
  '.agents/skills/semantic-claims/references/JAVASCRIPT.md',
  '.agents/skills/semantic-claims/references/README.md',
  '.agents/skills/semantic-claims/references/REFERENCE.md',
  'ELEPHANT-GOLDFISH.md',
  'EXAMPLES.md',
  'FAQ.md',
  'JAVASCRIPT.md',
  'LICENSE',
  'OVERVIEW.md',
  'README.md',
  'REFERENCE.md',
  'assets/semantic-explorer.png',
  'package.json',
  'scripts/check-semantics.mjs',
  'scripts/check-semantics/parse.mjs',
  'scripts/check-semantics/typescript.mjs',
  'scripts/check-semantics/validate.mjs',
  'scripts/semantic-explorer/model.mjs',
  'scripts/semantic-explorer/render.mjs',
  'scripts/semantic-explorer/server.mjs',
];
const EXPECTED_NAME = 'semantic-claims';
const REPOSITORY_ROOT = fileURLToPath(
  new URL('../', import.meta.url),
);
const { version: EXPECTED_VERSION } = JSON.parse(
  await readFile(path.join(REPOSITORY_ROOT, 'package.json'), 'utf8'),
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`,
  );
}

function isInside(parent, candidate) {
  const relativePath = path.relative(parent, candidate);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== '..' &&
      !path.isAbsolute(relativePath))
  );
}

function parseExpectedNode(arguments_) {
  assert(
    arguments_.length === 1,
    'Usage: node scripts/package-smoke.mjs --expected-node=22|24',
  );
  const match = /^--expected-node=(22|24)$/.exec(arguments_[0]);
  assert(
    match,
    'Usage: node scripts/package-smoke.mjs --expected-node=22|24',
  );
  return Number(match[1]);
}

async function runProcess(executable, arguments_, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    let stdout = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      reject(
        new Error(`Failed to start ${executable}: ${error.message}`, {
          cause: error,
        }),
      );
    });
    child.on('close', (status, signal) => {
      if (signal) {
        reject(
          new Error(`${executable} terminated by signal ${signal}.`),
        );
        return;
      }
      if (status === null) {
        reject(new Error(`${executable} returned no process status.`));
        return;
      }
      resolve({ status, stderr, stdout });
    });
  });
}

function npmCommand(arguments_) {
  const npmExecutable = process.env.npm_execpath;
  if (npmExecutable) {
    return {
      arguments: [npmExecutable, ...arguments_],
      executable: process.execPath,
    };
  }
  return { arguments: arguments_, executable: 'npm' };
}

async function runNpm(arguments_, options) {
  const command = npmCommand(arguments_);
  return runProcess(command.executable, command.arguments, options);
}

function requireSuccess(result, operation) {
  assert(
    result.status === 0,
    `${operation} failed with status ${result.status}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

async function verifyMarkdownLinks(packageRoot) {
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

  for (const document of EXPECTED_FILES.filter((file) =>
    file.endsWith('.md'),
  )) {
    const documentPath = path.join(packageRoot, document);
    const markdown = await readFile(documentPath, 'utf8');

    for (const match of markdown.matchAll(linkPattern)) {
      let target = match[1].trim();
      if (target.startsWith('<') && target.endsWith('>')) {
        target = target.slice(1, -1);
      } else {
        [target] = target.split(/\s+/, 1);
      }

      if (
        target === '' ||
        target.startsWith('#') ||
        path.isAbsolute(target) ||
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(target)
      ) {
        continue;
      }

      const fileTarget = target.split(/[?#]/, 1)[0];
      if (fileTarget === '') {
        continue;
      }
      const resolvedTarget = path.resolve(
        path.dirname(documentPath),
        fileTarget,
      );
      assert(
        isInside(packageRoot, resolvedTarget),
        `${document} relative link escapes the installed package: ${target}.`,
      );
      try {
        await stat(resolvedTarget);
      } catch (error) {
        throw new Error(
          `${document} relative link has no packaged target: ${target}.`,
          { cause: error },
        );
      }
    }
  }
}

async function verifyInstalledManifest(packageRoot) {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
  );

  assertEqual(manifest.name, EXPECTED_NAME, 'Installed package name');
  assertEqual(
    manifest.version,
    EXPECTED_VERSION,
    'Installed package version',
  );
  assertEqual(manifest.license, 'MIT', 'Installed package license');
  assertEqual(manifest.type, 'module', 'Installed package module type');
  assertEqual(
    manifest.bin,
    { 'semantic-claims': 'scripts/check-semantics.mjs' },
    'Installed package binary',
  );
  assertEqual(
    manifest.engines?.node,
    '^22.0.0 || ^24.0.0',
    'Installed package Node engines',
  );
  assertEqual(
    manifest.dependencies?.typescript,
    '7.0.2',
    'Installed TypeScript dependency',
  );
  assertEqual(
    manifest.repository,
    {
      type: 'git',
      url: 'git+https://github.com/hejhi/semantic-claims.git',
    },
    'Installed package repository',
  );
  assertEqual(
    manifest.homepage,
    'https://github.com/hejhi/semantic-claims#readme',
    'Installed package homepage',
  );
  assertEqual(
    manifest.bugs,
    { url: 'https://github.com/hejhi/semantic-claims/issues' },
    'Installed package issues',
  );
  assertEqual(
    manifest.publishConfig,
    {
      access: 'public',
      registry: 'https://registry.npmjs.org/',
      tag: 'alpha',
    },
    'Installed package publication metadata',
  );
}

async function exerciseInstalledChecker(fixtureRoot, environment) {
  const proofPath = path.join(
    fixtureRoot,
    'smoke.invariants.test.ts',
  );
  const validProof = `describe('§1 — Smoke validation', () => {
  test('§1.1 — The installed checker validates a matching proof', () => {});
});
`;
  await writeFile(
    path.join(fixtureRoot, 'smoke.invariants.md'),
    `# Smoke Invariants

## §1 Smoke validation

### §1.1 The installed checker validates a matching proof

The matching static proof title provides structural coverage.
`,
  );
  await writeFile(proofPath, validProof);

  const valid = await runNpm(
    ['exec', '--no', '--', 'semantic-claims', 'invariants'],
    { cwd: fixtureRoot, env: environment },
  );
  assert(
    valid.status === 0,
    `Valid checker returned status ${valid.status}.\nstdout:\n${valid.stdout}\nstderr:\n${valid.stderr}`,
  );
  assert(
    valid.stdout.includes(
      'Invariants validation passed for 1 named invariant pair.',
    ),
    `Valid checker output omitted the successful summary.\nstdout:\n${valid.stdout}`,
  );
  assertEqual(valid.stderr, '', 'Valid checker stderr');

  await writeFile(
    proofPath,
    `describe('§1 — Smoke validation', () => {
  test('§1.1 — A different proof title', () => {});
});
`,
  );

  const mismatch = await runNpm(
    ['exec', '--no', '--', 'semantic-claims', 'invariants'],
    { cwd: fixtureRoot, env: environment },
  );
  assert(mismatch.status !== 0, 'Title mismatch unexpectedly succeeded.');
  assert(
    mismatch.stderr.includes('smoke.invariants.test.ts') &&
      mismatch.stderr.includes('§1.1') &&
      mismatch.stderr.includes('title mismatch'),
    `Title mismatch diagnostics omitted required context.\nstderr:\n${mismatch.stderr}`,
  );
  assert(
    !mismatch.stdout.includes('Invariants validation passed'),
    'Title mismatch printed a successful validation summary.',
  );

  const unsupported = await runNpm(
    [
      'exec',
      '--no',
      '--',
      'semantic-claims',
      'invariants',
      'unknown',
    ],
    { cwd: fixtureRoot, env: environment },
  );
  assert(
    unsupported.status !== 0,
    'Unsupported checker invocation unexpectedly succeeded.',
  );
  assert(
    unsupported.stderr.includes(
      'Usage: semantic-claims [invariants] [scenarios]',
    ),
    `Unsupported invocation omitted usage.\nstderr:\n${unsupported.stderr}`,
  );
  assert(
    !unsupported.stdout.includes('validation passed'),
    'Unsupported invocation printed a successful validation summary.',
  );
  assert(
    !unsupported.stderr.includes('title mismatch'),
    'Unsupported invocation traversed and reported the fixture mismatch.',
  );

  await writeFile(proofPath, validProof);
}

async function exerciseInstalledExplorer(
  fixtureRoot,
  installedPackageRoot,
  environment,
) {
  const entryPoint = path.join(
    installedPackageRoot,
    'scripts',
    'check-semantics.mjs',
  );
  const child = spawn(process.execPath, [entryPoint, 'explore'], {
    cwd: fixtureRoot,
    env: environment,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  try {
    const firstLine = await new Promise((resolve, reject) => {
      let stdout = '';
      const timeout = setTimeout(() => {
        reject(new Error('Installed explorer did not report its URL.'));
      }, 15_000);
      const finish = (callback) => {
        clearTimeout(timeout);
        child.stdout.off('data', onData);
        child.off('close', onClose);
        callback();
      };
      const onData = (chunk) => {
        stdout += chunk;
        if (stdout.includes('\n')) {
          finish(() => resolve(stdout.split(/\r?\n/, 1)[0]));
        }
      };
      const onClose = (status) => {
        finish(() =>
          reject(
            new Error(
              `Installed explorer exited with status ${status} before reporting its URL.\nstderr:\n${stderr}`,
            ),
          ),
        );
      };
      child.stdout.on('data', onData);
      child.once('close', onClose);
    });

    const prefix = 'Semantic Explorer: ';
    assert(
      firstLine.startsWith(prefix),
      `Installed explorer reported an unexpected first line: ${firstLine}`,
    );
    const url = new URL(firstLine.slice(prefix.length));
    assertEqual(url.hostname, '127.0.0.1', 'Installed explorer host');

    const response = await fetch(url);
    assertEqual(response.status, 200, 'Installed explorer response status');
    const html = await response.text();
    assert(
      html.includes('data-subject-id="smoke"') &&
        html.includes('Semantic Explorer'),
      'Installed explorer omitted the smoke subject or page identity.',
    );
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await new Promise((resolve) => child.once('close', resolve));
    }
  }

  assertEqual(stderr, '', 'Installed explorer stderr');
}

async function verifyPackage(expectedNode, temporaryRoot) {
  const packRoot = path.join(temporaryRoot, 'pack');
  const fixtureRoot = path.join(temporaryRoot, 'fixture');
  const npmCache = path.join(temporaryRoot, 'npm-cache');
  const npmTemporary = path.join(temporaryRoot, 'npm-tmp');
  await Promise.all(
    [packRoot, fixtureRoot, npmCache, npmTemporary].map((directory) =>
      mkdir(directory, { recursive: true }),
    ),
  );

  const environment = {
    ...process.env,
    PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`,
    TEMP: npmTemporary,
    TMP: npmTemporary,
    TMPDIR: npmTemporary,
    npm_config_audit: 'false',
    npm_config_cache: npmCache,
    npm_config_fund: 'false',
    npm_config_package_lock: 'false',
    npm_config_update_notifier: 'false',
  };
  delete environment.npm_config_local_prefix;
  delete environment.npm_config_package;
  delete environment.npm_config_prefix;
  delete environment.npm_config_yes;

  const packed = await runNpm(
    [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      packRoot,
    ],
    { cwd: REPOSITORY_ROOT, env: environment },
  );
  requireSuccess(packed, 'npm pack');

  let records;
  try {
    records = JSON.parse(packed.stdout);
  } catch (error) {
    throw new Error(
      `npm pack did not return parseable JSON.\nstdout:\n${packed.stdout}\nstderr:\n${packed.stderr}`,
      { cause: error },
    );
  }
  assert(
    Array.isArray(records) && records.length === 1,
    `npm pack must return exactly one package record, received ${JSON.stringify(records)}.`,
  );
  const [record] = records;
  assertEqual(record.name, EXPECTED_NAME, 'Packed package name');
  assertEqual(record.version, EXPECTED_VERSION, 'Packed package version');
  assert(
    typeof record.integrity === 'string' && record.integrity.length > 0,
    'Packed package record omitted integrity.',
  );
  const packedFiles = record.files
    .map(({ path: filePath }) => filePath)
    .sort();
  assertEqual(
    packedFiles,
    [...EXPECTED_FILES].sort(),
    'Packed file inventory',
  );

  const tarballPath = path.resolve(packRoot, record.filename);
  assert(
    isInside(packRoot, tarballPath),
    `Packed tarball escaped its destination: ${record.filename}.`,
  );
  await access(tarballPath);

  await writeFile(
    path.join(fixtureRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'semantic-claims-package-smoke-fixture',
        private: true,
        type: 'module',
      },
      null,
      2,
    )}\n`,
  );

  const installed = await runNpm(
    [
      'install',
      tarballPath,
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--package-lock=false',
    ],
    { cwd: fixtureRoot, env: environment },
  );
  requireSuccess(installed, 'External npm installation');

  try {
    await access(path.join(fixtureRoot, 'package-lock.json'));
    throw new Error('External npm installation created package-lock.json.');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const installedPackageRoot = path.join(
    fixtureRoot,
    'node_modules',
    EXPECTED_NAME,
  );
  await verifyInstalledManifest(installedPackageRoot);
  await verifyMarkdownLinks(installedPackageRoot);
  await exerciseInstalledChecker(fixtureRoot, environment);
  await exerciseInstalledExplorer(
    fixtureRoot,
    installedPackageRoot,
    environment,
  );

  return {
    files: packedFiles,
    integrity: record.integrity,
    node: expectedNode,
  };
}

async function main() {
  const expectedNode = parseExpectedNode(process.argv.slice(2));
  const actualNode = Number(process.versions.node.split('.')[0]);
  assertEqual(actualNode, expectedNode, 'Node major');

  let report;
  let temporaryRoot;
  let verificationError;

  try {
    temporaryRoot = await mkdtemp(
      path.join(tmpdir(), 'semantic-claims-package-smoke-'),
    );
    assert(
      !isInside(REPOSITORY_ROOT, temporaryRoot),
      `Temporary root must be outside the repository: ${temporaryRoot}.`,
    );
    report = await verifyPackage(expectedNode, temporaryRoot);
  } catch (error) {
    verificationError = error;
  } finally {
    if (temporaryRoot) {
      await rm(temporaryRoot, { force: true, recursive: true }).catch(
        (cleanupError) => {
          verificationError = verificationError
            ? new AggregateError(
                [verificationError, cleanupError],
                'Package verification and cleanup both failed.',
              )
            : cleanupError;
        },
      );
    }
  }

  if (verificationError) {
    throw verificationError;
  }

  console.log(
    `${EXPECTED_NAME}@${EXPECTED_VERSION} package smoke passed under Node ${report.node}.`,
  );
  console.log(`Tarball integrity: ${report.integrity}`);
  console.log(`Packed files: ${report.files.join(', ')}`);
}

await main().catch((error) => {
  if (error instanceof AggregateError) {
    console.error(error.message);
    for (const cause of error.errors) {
      console.error(cause.stack ?? cause.message);
    }
  } else {
    console.error(error.stack ?? error.message);
  }
  process.exitCode = 1;
});
