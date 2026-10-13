import { prisma } from '@ifpc/database';

/** Pregunta ya parseada del builder (la primera opción es la correcta). */
export interface ParsedQuizQuestion {
  prompt: string;
  options: string[];
}

/**
 * Parsea el textarea del builder de quizzes: una pregunta por línea con el
 * formato `Pregunta | respuesta correcta | incorrecta | incorrecta…`.
 *
 * Se ignoran las líneas vacías, las que empiezan por `#` (comentarios) y las que
 * no llegan a prompt + una correcta + al menos una incorrecta.
 *
 * Única fuente de verdad: la usan el builder del admin y el de coaches y clubes.
 */
export function parseQuizQuestions(raw: string | null | undefined): ParsedQuizQuestion[] {
  return (raw ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const parts = line
        .split('|')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      if (parts.length < 3) return null;
      const [prompt, ...options] = parts;
      if (!prompt) return null;
      return { prompt, options };
    })
    .filter((question): question is ParsedQuizQuestion => question !== null);
}

/**
 * Vuelca las preguntas guardadas al formato del textarea (con la correcta
 * primero), para poder editarlas sin reescribirlas.
 */
export function quizQuestionsToText(
  questions: { prompt: string; options: { label: string; isCorrect: boolean }[] }[]
): string {
  return questions
    .map((question) => {
      const ordered = [...question.options].sort(
        (a, b) => Number(b.isCorrect) - Number(a.isCorrect)
      );
      return [question.prompt, ...ordered.map((option) => option.label)].join(' | ');
    })
    .join('\n');
}

/** Normaliza el porcentaje mínimo para aprobar (1-100; por defecto 70). */
export function parsePassScore(raw: string | null | undefined): number {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 70;
}

/**
 * Crea o reemplaza el quiz de un contenido: borra el anterior para no dejar
 * preguntas huérfanas. Devuelve `false` si no queda ninguna pregunta válida (en
 * ese caso no toca la base de datos).
 */
export async function replaceContentQuiz(
  contentId: string,
  input: { title: string; passScore: number; questions: ParsedQuizQuestion[] }
): Promise<boolean> {
  if (input.questions.length === 0) return false;

  await prisma.quiz.deleteMany({ where: { contentId } });
  await prisma.quiz.create({
    data: {
      contentId,
      title: input.title,
      passScore: input.passScore,
      questions: {
        create: input.questions.map((question, questionIndex) => ({
          prompt: question.prompt,
          position: questionIndex,
          options: {
            create: question.options.map((label, optionIndex) => ({
              label,
              isCorrect: optionIndex === 0,
              position: optionIndex,
            })),
          },
        })),
      },
    },
  });

  return true;
}

/** Pregunta guardada, tal como la devuelve Prisma (ordenada). */
export function quizDelete(contentId: string) {
  return prisma.quiz.deleteMany({ where: { contentId } });
}
