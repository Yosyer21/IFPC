import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@ifpc/ui';
import { CountUp } from './count-up';

export function StatCard({
  href,
  icon: Icon,
  label,
  value,
  suffix,
  delay = 0,
}: {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
}) {
  return (
    <Link
      href={href}
      className="animate-fade-up group block"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className="card-hover h-full">
        <CardContent className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-[#4f6b0a] transition-transform group-hover:scale-105">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="font-display text-3xl leading-none tabular-nums">
              <CountUp value={value} />
              {suffix ? <span className="text-base font-semibold">{suffix}</span> : null}
            </div>
            <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
