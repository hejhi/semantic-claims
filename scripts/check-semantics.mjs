#!/usr/bin/env node

import {
  KIND_CONFIG,
  loadRepository,
} from './check-semantics/repository.mjs';

const ROOT = process.cwd();

function printUsage() {
  console.error(
    'Usage: semantic-claims [invariants] [scenarios]\n' +
      '       semantic-claims explore\n' +
      '       semantic-claims skill <install|update|remove> [directory]',
  );
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

  if (arguments_[0] === 'skill') {
    try {
      const { runSkillManagement } = await import(
        './skill-management.mjs'
      );
      console.log(await runSkillManagement(arguments_.slice(1), ROOT));
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

  const kinds =
    new Set(arguments_).size === 0
      ? Object.keys(KIND_CONFIG)
      : Object.keys(KIND_CONFIG).filter((kind) =>
          arguments_.includes(kind),
        );
  const { errors, results } = await loadRepository(ROOT, kinds);

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
}

await main();
