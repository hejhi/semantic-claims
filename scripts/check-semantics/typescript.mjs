import { API as TypeScriptAPI } from 'typescript/unstable/async';
import * as ts from 'typescript/unstable/ast';

export { ts };

export async function openTypeScriptSources(filePaths, cwd) {
  if (filePaths.length === 0) {
    return {
      close: async () => {},
      sources: new Map(),
    };
  }

  const api = new TypeScriptAPI({ cwd });
  let snapshot;

  try {
    snapshot = await api.updateSnapshot({ openFiles: filePaths });
    const sources = new Map();

    for (const filePath of filePaths) {
      const project = await snapshot.getDefaultProjectForFile(filePath);
      const sourceFile = project
        ? await project.program.getSourceFile(filePath)
        : undefined;
      if (!sourceFile) {
        throw new Error(`TypeScript did not load proof file ${filePath}.`);
      }
      sources.set(filePath, sourceFile);
    }

    return {
      sources,
      close: async () => {
        await snapshot.dispose();
        await api.close();
      },
    };
  } catch (error) {
    await snapshot?.dispose();
    await api.close();
    throw error;
  }
}
