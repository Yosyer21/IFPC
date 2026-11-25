import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_FOLDER_LABELS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_EXT,
  documentExpiryStatus,
  documentSignatureValid,
  documentUploadError,
  isDocumentFolder,
} from '../../../apps/web/lib/documents';

const NOW = new Date('2026-06-15T12:00:00Z');

describe('documents helpers', () => {
  it('reconoce solo carpetas válidas', () => {
    expect(isDocumentFolder('identity')).toBe(true);
    expect(isDocumentFolder('medical')).toBe(true);
    expect(isDocumentFolder('nope')).toBe(false);
    expect(DOCUMENT_FOLDER_LABELS.academic).toBe('Academic records');
  });

  it('calcula el estado de vencimiento', () => {
    expect(documentExpiryStatus(null, NOW).state).toBe('none');
    expect(documentExpiryStatus(new Date('2026-09-01'), NOW).state).toBe('valid');
    expect(documentExpiryStatus(new Date('2026-07-05'), NOW).state).toBe('expiring');
    expect(documentExpiryStatus(new Date('2026-06-01'), NOW).state).toBe('expired');
    expect(documentExpiryStatus(new Date('2026-06-20'), NOW).days).toBe(5);
  });

  it('valida tipo y tamaño antes de guardar', () => {
    expect(documentUploadError({ size: 1000, type: 'application/pdf' })).toBeNull();
    expect(documentUploadError({ size: 0, type: 'application/pdf' })).toBe('Select a file.');
    expect(
      documentUploadError({ size: DOCUMENT_MAX_BYTES + 1, type: 'application/pdf' })
    ).toContain('too large');
    expect(documentUploadError({ size: 1000, type: 'text/html' })).toContain('PDF or image');
    expect(DOCUMENT_MIME_EXT['image/png']).toBe('png');
  });

  it('valida la firma real del archivo', () => {
    expect(documentSignatureValid(Buffer.from('%PDF-1.7'), 'application/pdf')).toBe(true);
    expect(documentSignatureValid(Buffer.from('<html>'), 'application/pdf')).toBe(false);
    expect(documentSignatureValid(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg')).toBe(true);
    expect(
      documentSignatureValid(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'image/png'
      )
    ).toBe(true);
    expect(documentSignatureValid(Buffer.from('RIFFxxxxWEBP'), 'image/webp')).toBe(true);
  });
});
