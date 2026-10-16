'use client';

import { useActionState, useRef, useState } from 'react';
import { completeSignupAction, type ActionState } from '@/app/actions/auth';
import { Button, Input, Select } from '@ifpc/ui';
import {
  FOOT_LABELS,
  FOOT_OPTIONS,
  POSITION_LABELS,
  POSITIONS,
  type SignupRole,
} from '@ifpc/config';
import { nameParts } from '@/lib/names';
import { RoleChoiceCards } from './role-choice-cards';
import { RoleFigure } from './role-figure';

type SlideKey = 'role' | 'identity' | 'game' | 'bench' | 'club' | 'place' | 'review';
type Slide = { key: SlideKey; title: string; hint: string };

/** Por si el índice se saliera de rango (no debería): nunca dejar el paso vacío. */
const FALLBACK_SLIDE: Slide = { key: 'role', title: 'Welcome', hint: '' };

/** Pasos del alta: primero el tipo de cuenta, luego su perfil. */
const SLIDES: Record<SignupRole, Slide[]> = {
  PLAYER: [
    { key: 'role', title: 'How will you use Future Baller?', hint: 'You can change it later.' },
    { key: 'identity', title: 'Who is the player?', hint: 'The name on the profile.' },
    { key: 'game', title: 'How do they play?', hint: 'Position, foot and birth date.' },
    { key: 'review', title: 'Ready to go', hint: 'This is what we will create.' },
  ],
  COACH: [
    { key: 'role', title: 'How will you use Future Baller?', hint: 'You can change it later.' },
    { key: 'identity', title: 'Your name', hint: 'How your players will see you.' },
    { key: 'bench', title: 'Your team', hint: 'The club you work with right now.' },
    { key: 'review', title: 'Ready to go', hint: 'This is what we will create.' },
  ],
  CLUB: [
    { key: 'role', title: 'How will you use Future Baller?', hint: 'You can change it later.' },
    { key: 'club', title: 'The club', hint: 'Name and country, as you want them shown.' },
    { key: 'place', title: 'Where you play', hint: 'Optional — but it helps scouting.' },
    { key: 'review', title: 'Ready to go', hint: 'This is what we will create.' },
  ],
};

/**
 * Alta en diapositivas: se elige el tipo de cuenta y, según cuál sea, se
 * personaliza el perfil (nombre, posición, pie, club…) en pasos que entran
 * deslizándose. Todo va en un solo formulario, así que el servidor valida una vez
 * y crea el perfil con `createRoleProfile`.
 */
export function CompleteSignupForm({
  defaultRole,
  accountName = '',
}: {
  defaultRole?: string;
  accountName?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    completeSignupAction,
    {}
  );
  const [role, setRole] = useState<SignupRole>(
    defaultRole && defaultRole in SLIDES ? (defaultRole as SignupRole) : 'PLAYER'
  );
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const slides = SLIDES[role];
  const total = slides.length;
  const slide = slides[Math.min(step, total - 1)] ?? FALLBACK_SLIDE;
  const { firstName: accountFirstName, lastName: accountLastName } = nameParts(accountName);

  /** Valores del formulario tal cual (sin controlarlos desde React). */
  function collect(): Record<string, string> {
    if (!formRef.current) return {};
    const values: Record<string, string> = {};
    for (const [key, value] of new FormData(formRef.current).entries()) {
      if (typeof value === 'string') values[key] = value;
    }
    return values;
  }

  /** Lo imprescindible de cada paso (el servidor lo revalida con zod). */
  function validateStep(): string | null {
    const values = collect();
    if (slide.key === 'identity') {
      if (role === 'PLAYER') {
        if (!values.firstName?.trim() || !values.lastName?.trim()) {
          return 'Please add the player name and surname.';
        }
      } else if (!values.name?.trim()) {
        return 'Please add your name.';
      }
    }
    if (slide.key === 'game' && !values.position) return 'Pick a position.';
    if (slide.key === 'club') {
      if (!values.name?.trim()) return 'Please add the club name.';
      if (!values.country?.trim()) return 'Please add the country.';
    }
    return null;
  }

  function goTo(index: number) {
    setStepError(null);
    setStep(Math.max(0, Math.min(index, total - 1)));
  }

  function advance() {
    const message = validateStep();
    if (message) {
      setStepError(message);
      return;
    }
    setSummary((previous) => ({ ...previous, ...collect() }));
    goTo(step + 1);
  }

  function changeRole(next: SignupRole) {
    setRole(next);
    setSummary({});
    goTo(0);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
    event.preventDefault();
    if (step < total - 1) advance();
    else formRef.current?.requestSubmit();
  }

  /** Lo que se ve en cada paso. */
  function renderSlide(key: SlideKey) {
    switch (key) {
      case 'role':
        return <RoleChoiceCards value={role} onChange={changeRole} />;
      case 'identity':
        return role === 'PLAYER' ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="firstName"
                label="Name"
                placeholder="Leo"
                defaultValue={accountFirstName}
              />
              <Input
                name="lastName"
                label="Surname"
                placeholder="Messi"
                defaultValue={accountLastName}
              />
            </div>
            <Input name="nationality" label="Nationality" placeholder="Spain" />
          </div>
        ) : (
          <Input
            name="name"
            label="Your name"
            placeholder="Alex Coach"
            defaultValue={accountName}
          />
        );
      case 'game':
        return (
          <div className="flex flex-col gap-4">
            <Select
              name="position"
              label="Position"
              placeholder="Pick one"
              options={POSITIONS.map((value) => ({ value, label: POSITION_LABELS[value] }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                name="foot"
                label="Preferred foot"
                placeholder="—"
                options={FOOT_OPTIONS.map((value) => ({ value, label: FOOT_LABELS[value] }))}
              />
              <Input name="dateOfBirth" type="date" label="Date of birth" />
            </div>
          </div>
        );
      case 'bench':
        return <Input name="clubName" label="Current club" placeholder="Club name" />;
      case 'club':
        return (
          <div className="flex flex-col gap-4">
            <Input name="name" label="Club name" placeholder="FC Future" />
            <Input name="country" label="Country" placeholder="Spain" />
          </div>
        );
      case 'place':
        return (
          <div className="grid grid-cols-2 gap-3">
            <Input name="city" label="City" placeholder="Madrid" />
            <Input name="league" label="League" placeholder="LaLiga" />
          </div>
        );
      default:
        return reviewSlide();
    }
  }

  /** Último paso: la figura del perfil y lo que se va a crear. */
  function reviewSlide() {
    const rows: Array<[string, string]> = [['Account type', role.toLowerCase()]];
    if (role === 'PLAYER') {
      rows.push(
        ['Name', [summary.firstName, summary.lastName].filter(Boolean).join(' ') || '—'],
        [
          'Position',
          summary.position
            ? POSITION_LABELS[summary.position as keyof typeof POSITION_LABELS]
            : '—',
        ],
        ['Foot', summary.foot ? FOOT_LABELS[summary.foot as keyof typeof FOOT_LABELS] : '—']
      );
    }
    if (role === 'COACH') rows.push(['Club', summary.clubName || '—']);
    if (role === 'CLUB') {
      rows.push(
        ['Club', summary.name || '—'],
        ['Country', summary.country || '—'],
        ['City', summary.city || '—']
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <span
            className="pointer-events-none absolute h-20 w-20 animate-pulse-dot rounded-full bg-brand/25 blur-2xl"
            aria-hidden="true"
          />
          <RoleFigure role={role} active className="h-24 w-24" />
        </div>
        <dl className="w-full space-y-2 rounded-xl border border-border bg-white/[0.03] p-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="truncate font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} onKeyDown={onKeyDown} className="flex flex-col gap-5">
      {/* Progreso del alta */}
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {step + 1} / {total}
        </span>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold">{slide.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{slide.hint}</p>
      </div>

      {/* Diapositivas: todas viven en el mismo formulario y se deslizan. */}
      <div className="overflow-hidden">
        <div className="wizard-track flex" style={{ transform: `translateX(-${step * 100}%)` }}>
          {slides.map((item, index) => {
            const active = index === step;
            return (
              <div
                key={item.key}
                data-active={active ? 'true' : 'false'}
                inert={!active}
                aria-hidden={!active}
                className="wizard-slide w-full shrink-0 px-1"
              >
                <div className="wizard-inner flex flex-col gap-4">{renderSlide(item.key)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {stepError || state.error ? (
        <p className="text-sm text-destructive">{stepError ?? state.error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" className="flex-1" onClick={() => goTo(step - 1)}>
            Back
          </Button>
        ) : null}
        {step < total - 1 ? (
          <Button type="button" className="flex-1" onClick={advance}>
            Continue
          </Button>
        ) : (
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? 'Creating…' : 'Create my account'}
          </Button>
        )}
      </div>
    </form>
  );
}
