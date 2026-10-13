'use client';

import { useActionState } from 'react';
import { Button, Input } from '@ifpc/ui';
import { deleteContentQuizAction, saveContentQuizAction } from '@/app/actions/training';

export interface TrainingQuizFormProps {
  contentId: string;
  /** Preguntas ya guardadas, volcadas al formato de línea para editarlas. */
  questionsText: string;
  title: string;
  passScore: number;
  hasQuiz: boolean;
}

const TEXTAREA =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring';

/**
 * Builder de quiz de un curso: mismo formato que el del admin
 * (`Pregunta | respuesta correcta | incorrecta | incorrecta…`), pero sobre el
 * contenido propio del coach o del club.
 */
export function TrainingQuizForm({
  contentId,
  questionsText,
  title,
  passScore,
  hasQuiz,
}: TrainingQuizFormProps) {
  const [state, formAction, pending] = useActionState(saveContentQuizAction, {});

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="contentId" value={contentId} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
          <Input name="quizTitle" label="Quiz title" defaultValue={title} maxLength={140} />
          <Input
            name="passScore"
            type="number"
            min={1}
            max={100}
            label="Pass %"
            defaultValue={passScore}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="questions" className="text-sm font-medium">
            Questions
          </label>
          <textarea
            id="questions"
            name="questions"
            rows={6}
            defaultValue={questionsText}
            placeholder={
              'One question per line:\nWhat should the first touch have? | A purpose | Maximum power | A bounce'
            }
            className={TEXTAREA}
          />
          <p className="text-xs text-muted-foreground">
            The first option after the question is the correct one.
          </p>
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : hasQuiz ? 'Replace quiz' : 'Create quiz'}
          </Button>
        </div>
      </form>

      {hasQuiz ? (
        <form action={deleteContentQuizAction}>
          <input type="hidden" name="contentId" value={contentId} />
          <button type="submit" className="text-xs text-destructive hover:underline">
            Remove quiz
          </button>
        </form>
      ) : null}
    </div>
  );
}
