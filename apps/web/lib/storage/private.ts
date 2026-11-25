import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Almacén de documentos privados.
 *
 * Deliberadamente **fuera de `public/`**: los documentos (pasaportes, médicos,
 * contratos) nunca deben poder abrirse con una URL estática. La única vía es
 * `/api/documents/[documentId]/file`, que valida sesión y rol.
 *
 * En producción se puede montar un volumen y apuntar `PRIVATE_UPLOAD_DIR` a él.
 */
const ROOT = process.env.PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), '.private-uploads');

function safeKey(key: string): string {
  if (!key || key.startsWith('/') || key.includes('..') || key.includes('\0')) {
    throw new Error('Invalid private storage key');
  }
  return key;
}

export async function writePrivateObject(key: string, body: Buffer): Promise<void> {
  const target = path.join(ROOT, safeKey(key));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
}

export async function readPrivateObject(key: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(ROOT, safeKey(key)));
  } catch {
    return null;
  }
}

export async function removePrivateObject(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await rm(path.join(ROOT, safeKey(key)));
  } catch {
    // Best effort: si ya no está, nada que limpiar.
  }
}
