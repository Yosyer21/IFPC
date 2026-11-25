/** My Documents: carpetas del libro, etiquetas y estado de vencimiento. */

export const DOCUMENT_FOLDERS = [
  'academic',
  'identity',
  'medical',
  'references',
  'offers',
  'plans',
  'other',
] as const;
export type DocumentFolderValue = (typeof DOCUMENT_FOLDERS)[number];

export const DOCUMENT_FOLDER_LABELS: Record<DocumentFolderValue, string> = {
  academic: 'Academic records',
  identity: 'Identity',
  medical: 'Medical & consent',
  references: 'References',
  offers: 'Offers & contracts',
  plans: 'Specialist plans',
  other: 'Other',
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  contract: 'Contract',
  medical: 'Medical',
  academic: 'Academic',
  reference: 'Reference',
  plan: 'Plan',
  other: 'Other',
};

export function isDocumentFolder(value: unknown): value is DocumentFolderValue {
  return typeof value === 'string' && (DOCUMENT_FOLDERS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Subida privada
// ---------------------------------------------------------------------------

/** Tamaño máximo de un documento (10 MB). */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** MIME permitidos y extensión con la que se guarda (nunca la del nombre original). */
export const DOCUMENT_MIME_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Error de validación de la subida, o `null` si es válida. */
export function documentUploadError(file: { size: number; type: string }): string | null {
  if (file.size <= 0) return 'Select a file.';
  if (file.size > DOCUMENT_MAX_BYTES) return 'The file is too large (max 10 MB).';
  if (!DOCUMENT_MIME_EXT[file.type]) return 'Upload a PDF or image (JPG, PNG or WebP).';
  return null;
}

function startsWith(buffer: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

/**
 * Comprueba la firma real del archivo (magic bytes): el `file.type` que envía el
 * navegador es fácil de falsificar y un HTML renombrado a `.pdf` no debe entrar.
 */
export function documentSignatureValid(buffer: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'application/pdf') {
    return startsWith(buffer, [0x25, 0x50, 0x44, 0x46]); // %PDF
  }
  if (mimeType === 'image/jpeg') {
    return startsWith(buffer, [0xff, 0xd8, 0xff]);
  }
  if (mimeType === 'image/png') {
    return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === 'image/webp') {
    return (
      startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && // RIFF
      startsWith(buffer.slice(8), [0x57, 0x45, 0x42, 0x50]) // WEBP
    );
  }
  return false;
}

export type DocumentExpiryState = 'none' | 'valid' | 'expiring' | 'expired';

export interface DocumentExpiryStatus {
  state: DocumentExpiryState;
  /** Días hasta el vencimiento (negativo si ya venció); `null` si no aplica. */
  days: number | null;
}

/** Estado de vencimiento; avisa con `warnDays` de antelación (30 por defecto). */
export function documentExpiryStatus(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
  warnDays = 30
): DocumentExpiryStatus {
  if (!expiresAt) return { state: 'none', days: null };
  const days = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { state: 'expired', days };
  if (days <= warnDays) return { state: 'expiring', days };
  return { state: 'valid', days };
}
