import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { createOpportunityAction } from '@/app/actions/admin';

export const metadata: Metadata = { title: 'New opportunity' };

export default async function AdminOpportunityCreatePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [clubs, universities] = await Promise.all([
    prisma.club.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 100,
    }),
    prisma.university.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New opportunity"
        subtitle="Post an opportunity on behalf of a club or university"
        icon="target"
      >
        <Link href="/dashboard/admin/opportunities" className="text-sm text-muted-foreground hover:underline">
          ← Opportunities
        </Link>
      </PageHeader>

      <Card>
        <CardContent>
          <form action={createOpportunityAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              Title *
              <input
                required
                name="title"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="U-17 youth trial…"
              />
            </label>
            <label className="text-sm">
              Posted by
              <select name="creatorType" defaultValue="CLUB" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="CLUB">Club</option>
                <option value="UNIVERSITY">University</option>
              </select>
            </label>
            <label className="text-sm">
              Type
              <select name="type" defaultValue="TRIAL" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="TRIAL">Trial</option>
                <option value="SCOUTING">Scouting</option>
                <option value="CONTRACT">Contract</option>
                <option value="SCHOLARSHIP">Scholarship</option>
                <option value="ACADEMY">Academy</option>
              </select>
            </label>
            <label className="text-sm">
              Club
              <select name="clubId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Unassigned</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              University
              <select name="universityId" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="">Unassigned</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Position
              <input name="position" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" placeholder="DEL" />
            </label>
            <label className="text-sm">
              Location
              <input name="location" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" placeholder="Madrid" />
            </label>
            <label className="text-sm">
              Minimum age
              <input type="number" name="ageMin" min={5} max={40} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm">
              Maximum age
              <input type="number" name="ageMax" min={5} max={45} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm">
              Estado
              <select name="status" defaultValue="OPEN" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
            <label className="text-sm">
              Closes on
              <input type="date" name="closesAt" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
            >
              Post opportunity
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


