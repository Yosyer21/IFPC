import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentUploadForm } from '@/components/player/document-upload-form';

export const metadata: Metadata = { title: 'Subir documento' };

export default function PlayerDocumentUploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subir documento</h1>
        <Link
          href="/dashboard/player/documents"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mis documentos
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Los documentos (pasaporte, contrato, certificado médico…) se almacenan de forma local en
        esta fase. Solo tú y los perfiles autorizados en procesos de reclutamiento pueden verlos.
      </p>
      <DocumentUploadForm />
    </div>
  );
}
