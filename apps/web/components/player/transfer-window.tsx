'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, Progress } from '@ifpc/ui';
import { StatusBadge } from '@/components/admin/status-badge';
import { MatchScoreBadge } from '@/components/player/match-score';
import { declineOfferAction, requestOfferApprovalAction } from '@/app/actions/player';
import {
  TRANSFER_CATEGORIES,
  filterByCategory,
  type OfferKind,
  type TransferApplication,
  type TransferCategory,
  type TransferMatch,
  type TransferOffer,
} from '@/lib/transfer-window';

type WindowTab = 'offers' | 'matches' | 'applications';

export interface TransferWindowProps {
  offers: TransferOffer[];
  matches: TransferMatch[];
  applications: TransferApplication[];
  /** Fuerza del perfil (0-100), calculada en el servidor. */
  profileStrength: number;
  /** Siguiente mejor paso para mejorar el perfil. */
  nextStep: { label: string; href: string; hint: string };
}

function closesLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Closes in ${days} days`;
}

function replyLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return 'Reply today';
  if (days === 1) return 'Reply in 1 day';
  return `Reply in ${days} days`;
}

function sentLabel(days: number): string {
  if (days === 0) return 'Sent today';
  if (days === 1) return 'Sent yesterday';
  return `Sent ${days} days ago`;
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

/** Botones de una oferta: aceptar (avisa a la familia) o rechazar. */
function OfferActions({ kind, offerId }: { kind: OfferKind; offerId: string }) {
  const [accept, acceptAction, accepting] = useActionState(requestOfferApprovalAction, {});
  const [decline, declineAction, declining] = useActionState(declineOfferAction, {});
  const busy = accepting || declining;

  if (accept.success) {
    return (
      <p
        role="status"
        className="rounded-full bg-brand/15 px-3 py-1.5 text-xs font-semibold text-[#4f6b0a]"
      >
        {accept.success}
      </p>
    );
  }

  if (decline.success) {
    return (
      <p
        role="status"
        className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"
      >
        {decline.success}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={acceptAction}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="offerId" value={offerId} />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {accepting ? 'Sending…' : 'Accept: send to parent'}
        </button>
      </form>
      <form action={declineAction}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="offerId" value={offerId} />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {declining ? 'Declining…' : 'Decline'}
        </button>
      </form>
      {accept.error || decline.error ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {accept.error ?? decline.error}
        </p>
      ) : null}
    </div>
  );
}

function OfferCard({ offer }: { offer: TransferOffer }) {
  const deadline = replyLabel(offer.daysToReply);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {offer.tag}
            </span>
            {offer.isNew ? (
              <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4f6b0a]">
                New offer
              </span>
            ) : null}
          </div>
          {deadline ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {deadline}
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="font-semibold leading-tight">{offer.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {offer.organisation}
            {offer.meta ? ` · ${offer.meta}` : ''}
          </p>
        </div>

        {offer.message ? (
          <p className="text-sm leading-relaxed text-muted-foreground">“{offer.message}”</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <OfferActions kind={offer.kind} offerId={offer.id} />
          <Link
            href={offer.href}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            View details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchCard({ match }: { match: TransferMatch }) {
  const closes = closesLabel(match.closesInDays);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {match.type}
          </span>
          <MatchScoreBadge score={match.match} />
        </div>
        <h3 className="font-semibold leading-tight">{match.title}</h3>
        <p className="text-xs text-muted-foreground">
          {match.organisation}
          {match.location ? ` · ${match.location}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {closes ? <span>{closes}</span> : null}
          <Link href={match.href} className="font-semibold text-[#4f6b0a] hover:underline">
            View details →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationCard({ application }: { application: TransferApplication }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {application.type}
          </span>
          <StatusBadge status={application.status} />
        </div>
        <h3 className="font-semibold leading-tight">{application.title}</h3>
        <p className="text-xs text-muted-foreground">{application.organisation}</p>
        <p className="text-xs text-muted-foreground">{sentLabel(application.daysAgo)}</p>
        <Link
          href={application.href}
          className="mt-auto inline-flex text-xs font-semibold text-[#4f6b0a] hover:underline"
        >
          View details →
        </Link>
      </CardContent>
    </Card>
  );
}

export function TransferWindow({
  offers,
  matches,
  applications,
  profileStrength,
  nextStep,
}: TransferWindowProps) {
  const [activeTab, setActiveTab] = useState<WindowTab>('offers');
  const [filter, setFilter] = useState<TransferCategory>('ALL');

  const visibleOffers = useMemo(() => filterByCategory(offers, filter), [offers, filter]);
  const visibleMatches = useMemo(() => filterByCategory(matches, filter), [matches, filter]);
  const visibleApplications = useMemo(
    () => filterByCategory(applications, filter),
    [applications, filter]
  );

  const tabs: { id: WindowTab; label: string; count: number }[] = [
    { id: 'offers', label: 'Offers for you', count: offers.length },
    { id: 'matches', label: 'Open matches', count: matches.length },
    { id: 'applications', label: 'My applications', count: applications.length },
  ];

  const stats = [
    { value: offers.length, label: 'Offers waiting' },
    { value: matches.length, label: 'Matches' },
    { value: applications.length, label: 'Applications' },
  ];

  const empty = (title: string, hint: string): ReactNode => (
    <EmptyState title={title} hint={hint} />
  );

  return (
    <div className="animate-fade-up">
      {/* Cabecera oscura: la «ventana» abierta. */}
      <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-[90px]"
        />
        <div
          aria-hidden="true"
          className="bg-bars-faint-invert pointer-events-none absolute inset-0 opacity-40"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-ink">
            Window open
          </span>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-5xl">
            Transfer
            <br />
            window
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            Scholarships, school places and trials that match your profile. Offers from scouts land
            here too.
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-2xl font-black tabular-nums text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Fuerza del perfil + siguiente paso. */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Profile strength:{' '}
            <span className="tabular-nums text-[#4f6b0a]">{profileStrength}%</span>
          </p>
          <Link
            href={nextStep.href}
            className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-ink transition-transform hover:scale-[1.02]"
          >
            {nextStep.label} →
          </Link>
        </div>
        <Progress value={profileStrength} className="mt-3" />
        <p className="mt-2 text-xs text-muted-foreground">{nextStep.hint}</p>
      </div>

      {/* Tabs internas. */}
      <div
        role="tablist"
        aria-label="Transfer window"
        className="mt-6 flex flex-wrap gap-1 rounded-full border border-border bg-muted/70 p-1"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                  active ? 'bg-white/15 text-white' : 'bg-background text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros por tipo de organización. */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {TRANSFER_CATEGORIES.map((category) => {
          const active = filter === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(category.id)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                active
                  ? 'border-ink bg-ink text-white'
                  : 'border-border bg-card text-muted-foreground hover:border-ink/30 hover:text-foreground'
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {activeTab === 'offers' ? (
          visibleOffers.length === 0 ? (
            empty(
              'No offers here yet.',
              'When a club or university reaches out, their offer lands in this tab.'
            )
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )
        ) : null}

        {activeTab === 'matches' ? (
          visibleMatches.length === 0 ? (
            empty(
              'No open matches in this category.',
              'Try another filter or check back when new opportunities are published.'
            )
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )
        ) : null}

        {activeTab === 'applications' ? (
          visibleApplications.length === 0 ? (
            empty(
              "You haven't applied to anything yet.",
              'Open a match and send your request to start the conversation.'
            )
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
