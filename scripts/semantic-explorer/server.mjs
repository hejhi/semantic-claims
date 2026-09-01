import { promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { buildExplorerModel } from './model.mjs';
import { renderExplorer, renderSource } from './render.mjs';

const LOOPBACK_HOST = '127.0.0.1';

function send(response, status, contents, method, contentType = 'text/html') {
  const body = method === 'HEAD' ? '' : contents;
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(contents),
    'content-type': `${contentType}; charset=utf-8`,
    'x-content-type-options': 'nosniff',
  });
  response.end(body);
}

function sourcePaths(model) {
  const paths = new Set();
  for (const claim of model.claims) {
    paths.add(claim.claimDocument.path);
    for (const proof of claim.proofs) {
      paths.add(proof.path);
    }
  }
  return paths;
}

export async function createExplorerServer({
  port = 0,
  root = process.cwd(),
} = {}) {
  const repositoryRoot = path.resolve(root);
  const model = await buildExplorerModel(repositoryRoot);
  const allowedSources = sourcePaths(model);
  const server = http.createServer(async (request, response) => {
    try {
      const method = request.method ?? 'GET';
      if (method !== 'GET' && method !== 'HEAD') {
        send(response, 405, 'Method not allowed.', method, 'text/plain');
        return;
      }

      const requestUrl = new URL(
        request.url ?? '/',
        `http://${LOOPBACK_HOST}`,
      );
      if (requestUrl.pathname === '/') {
        send(
          response,
          200,
          renderExplorer(model, requestUrl.searchParams),
          method,
        );
        return;
      }

      if (requestUrl.pathname === '/source') {
        const requestedPath = requestUrl.searchParams.get('path') ?? '';
        const requestedLine = Number.parseInt(
          requestUrl.searchParams.get('line') ?? '1',
          10,
        );
        if (!allowedSources.has(requestedPath)) {
          send(response, 404, 'Source not found.', method, 'text/plain');
          return;
        }
        const contents = await fs.readFile(
          path.join(repositoryRoot, ...requestedPath.split('/')),
          'utf8',
        );
        send(
          response,
          200,
          renderSource({
            contents,
            line: Number.isSafeInteger(requestedLine) ? requestedLine : 1,
            path: requestedPath,
          }),
          method,
        );
        return;
      }

      send(response, 404, 'Not found.', method, 'text/plain');
    } catch (error) {
      send(
        response,
        500,
        `Semantic Explorer request failed: ${error.message}`,
        request.method ?? 'GET',
        'text/plain',
      );
    }
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, LOOPBACK_HOST);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Semantic Explorer did not receive a TCP address.');
  }

  return {
    address,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    model,
    url: `http://${LOOPBACK_HOST}:${address.port}/`,
  };
}
