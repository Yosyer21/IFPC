import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { StatCard } from '@/components/player/stat-card';
import { IconMail, IconMessageCircle, IconUsers } from '@/components/dashboard/icons';
import { markConversationReadAction } from '@/app/actions/admin';

export const metadata: Metadata = { title: 'Comunicaciones' };

export default async function AdminCommunicationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const conversations = await prisma.conversation.findMany({
    include: {
      participants: { include: { user: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const unread = conversations.reduce(
    (sum, c) =>
      sum +
      c.messages.filter(
        (m) => m.senderId !== session.user.id && !m.readAt
      ).length,
    0
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Comunicaciones"
        subtitle="Conversaciones de la plataforma y mensajes internos"
        icon="mail"
      >
        <Link
          href="/dashboard/admin/communications/messages"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ver mensajes
        </Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard href="/dashboard/admin/communications" icon={IconMessageCircle} label="Conversaciones" value={conversations.length} />
        <StatCard href="/dashboard/admin/communications/messages" icon={IconMail} label="Mensajes" value={totalMessages} />
        <StatCard href="/dashboard/admin/communications/messages" icon={IconUsers} label="Sin leer" value={unread} />
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay conversaciones todavía. Las conversaciones entre clubes, jugadores y la
              plataforma aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((conversation) => {
            const last = conversation.messages[conversation.messages.length - 1];
            return (
              <Card key={conversation.id} className="card-hover">
                <CardContent className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{conversation.subject}</span>
                      <Badge variant="outline">{conversation.messages.length} mensajes</Badge>
                      {last && last.senderId !== session.user.id && !last.readAt ? (
                        <Badge variant="warning">Nuevo</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {conversation.participants.map((p) => p.user.name).join(' · ')}
                    </p>
                    {last ? (
                      <p className="mt-2 truncate text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{last.sender.name}:</span>{' '}
                        {last.body}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/admin/communications/messages"
                      className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <form action={markConversationReadAction}>
                      <input type="hidden" name="conversationId" value={conversation.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        Marcar leído
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


