'use client';

import { SIGNUP_ROLE_OPTIONS, type SignupRole } from '@ifpc/config';
import { RoleFigure } from './role-figure';

/**
 * Selector de tipo de cuenta: tres tarjetas con su figura animada (balón,
 * pizarra y escudo). Lo usan el alta por email y `/welcome`, así que el gesto
 * es el mismo en los dos sitios.
 *
 * El radio real sigue ahí (oculto pero accesible: teclado y lectores de pantalla
 * incluidos), la tarjeta entera es su etiqueta.
 */
export function RoleChoiceCards({
  value,
  onChange,
  name = 'role',
}: {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  name?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium">Account type</legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {SIGNUP_ROLE_OPTIONS.map((option) => {
          const active = value === option.value;

          return (
            <label
              key={option.value}
              data-active={active ? 'true' : 'false'}
              className={`role-card group relative flex cursor-pointer flex-col items-center justify-start gap-1.5 rounded-xl border px-2 py-3 text-center ${
                active
                  ? 'border-primary bg-primary/[0.07]'
                  : 'border-border hover:border-primary/40 hover:bg-white/[0.02]'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              {/* Anillo de foco del teclado, sobre toda la tarjeta. */}
              <span
                className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
                aria-hidden="true"
              />

              <RoleFigure
                role={option.value}
                active={active}
                className="h-16 w-16 sm:h-20 sm:w-20"
              />

              <span className="text-sm font-semibold leading-none">{option.label}</span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                {option.description}
              </span>

              {active ? (
                <span
                  className="role-tick absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                  aria-hidden="true"
                >
                  ✓
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
