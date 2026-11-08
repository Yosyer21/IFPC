import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Un documento del Parents Book (archivo en `public/parents-book/`). */
export interface ParentsBookDoc {
  slug: string;
  filename: string;
  url: string;
  title: string;
  description: string | null;
  category: string;
  ext: string;
}

/**
 * Metadatos opcionales por nombre de archivo. Si un PDF está en la carpeta pero
 * no aquí, se muestra igual (título derivado del nombre). Añadir entradas solo
 * mejora el título/descripción/categoría.
 */
const META: Record<string, { title?: string; description?: string; category?: string }> = {};

const ALLOWED = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'txt',
  'csv',
]);

/** Organización temática de las guías por número (`FB 01`, `FB 02`…). */
const CATEGORY_BY_NUM: Record<string, string> = {
  '01': 'Wellbeing',
  '02': 'Mindset',
  '03': 'Support',
  '04': 'Support',
  '05': 'Matchday',
  '06': 'Mindset',
  '07': 'Wellbeing',
  '08': 'Mindset',
  '09': 'Matchday',
  '10': 'Matchday',
  '11': 'Mindset',
  '12': 'Matchday',
  '13': 'Pathway',
  '14': 'Wellbeing',
  '15': 'Wellbeing',
  '16': 'Mindset',
  '17': 'Mindset',
  '18': 'Support',
  '19': 'Pathway',
  '20': 'Pathway',
  '21': 'Pathway',
  '22': 'Wellbeing',
  '23': 'Mindset',
};

/** Número inicial del nombre (tras quitar el prefijo "FB"). */
function leadingNumber(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, '').replace(/^fb[\s-]*/i, '');
  const match = /^(\d{1,2})/.exec(base);
  return match?.[1] ?? null;
}

function prettyTitle(filename: string): string {
  let base = filename.replace(/\.[^.]+$/, '').replace(/\s+/g, ' ').trim();
  base = base.replace(/^fb[\s-]*/i, '');
  const match = /^(\d{1,2})[\s-–]*(.*)$/.exec(base);
  if (match) {
    const num = (match[1] ?? '').padStart(2, '0');
    const rest = (match[2] ?? '').replace(/[-_]+/g, ' ').trim();
    if (rest) return `${num} · ${rest}`;
  }
  return base.replace(/[-_]+/g, ' ').trim();
}

function slugify(filename: string): string {
  return (
    filename
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'document'
  );
}

/** Ubicaciones posibles de la carpeta (dev cwd = apps/web; standalone = raíz). */
function candidateDirs(): string[] {
  return [
    path.join(process.cwd(), 'public', 'parents-book'),
    path.join(process.cwd(), 'apps', 'web', 'public', 'parents-book'),
  ];
}

/**
 * Lee la carpeta del Parents Book y devuelve sus documentos. Si la carpeta no
 * existe (o está vacía) devuelve `[]`. Pensado para Server Components.
 */
export async function readParentsBookDocs(): Promise<ParentsBookDoc[]> {
  for (const dir of candidateDirs()) {
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }

    return files
      .filter((file) => !file.startsWith('.'))
      .filter((file) => file.toLowerCase() !== 'readme.txt')
      .filter((file) => ALLOWED.has(path.extname(file).toLowerCase().replace('.', '')))
      .map((filename) => {
        const ext = path.extname(filename).toLowerCase().replace('.', '');
        const meta = META[filename] ?? {};
        const num = leadingNumber(filename);
        return {
          slug: slugify(filename),
          filename,
          url: `/parents-book/${encodeURIComponent(filename)}`,
          title: meta.title ?? prettyTitle(filename),
          description: meta.description ?? null,
          category:
            meta.category ??
            (num ? CATEGORY_BY_NUM[num] : undefined) ??
            (ext === 'pdf' ? 'Guide' : ext.toUpperCase()),
          ext,
        } satisfies ParentsBookDoc;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }
  return [];
}

/** Un documento por slug (o `null`). */
export async function getParentsBookDoc(slug: string): Promise<ParentsBookDoc | null> {
  const docs = await readParentsBookDocs();
  return docs.find((doc) => doc.slug === slug) ?? null;
}
