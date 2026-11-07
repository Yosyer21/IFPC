import type { ReactNode } from 'react';
import { ICONS } from '@/components/dashboard/icons';

export function PageHeader({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: ReactNode;
}) {
  const Icon = icon ? ICONS[icon] : undefined;

  return (
    <div className="animate-fade-up mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-[#4f6b0a]">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          <h1 className="fb-page-title">{title}</h1>
          {subtitle ? <p className="fb-page-sub">{subtitle}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </div>
  );
}
