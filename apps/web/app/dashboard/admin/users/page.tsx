import type { Metadata } from 'next';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { ROLES } from '@ifpc/auth';
import { setUserRoleAction, deleteUserAction } from '@/app/actions/admin';
import { PageHeader } from '@/components/player/page-header';
import { RoleLinks } from '@/components/admin/role-links';

export const metadata: Metadata = { title: 'Users' };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const users = await prisma.user.findMany({
    where: role ? { role: role as never } : undefined,
    include: { _count: { select: { payments: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Users"
        subtitle="Platform accounts, roles and moderation"
        icon="users"
      />

      <div className="mb-4">
        <RoleLinks />
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay usuarios con este filtro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{user.role}</Badge>
                  <form action={setUserRoleAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                    >
                      {ROLES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      Actualizar
                    </button>
                  </form>
                  {user.id !== session.user.id ? (
                    <form action={deleteUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      >
                        Eliminar
                      </button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
