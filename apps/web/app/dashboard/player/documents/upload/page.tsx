import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentUploadForm } from '@/components/player/document-upload-form';

export const metadata: Metadata = { title: 'Upload document' };

export default function PlayerDocumentUploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Upload document</h1>
        <Link
          href="/dashboard/player/documents"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← My documents
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Documents (passport, contract, medical certificate…) are stored in private
        storage. Only you, your family and verified staff in recruitment can open them.
      </p>
      <DocumentUploadForm />
    </div>
  );
}
