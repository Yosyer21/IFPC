import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { createMessageAction } from '@/app/actions/admin';

export const metadata: Metadata = { title: 'Mensajes' };

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const conversations = await prisma.conversation.findMany({
    include: {
      participants: { include: { user: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mensajes" subtitle="Hilo de mensajes de todas las conversaciones" icon="mail">
        <Link href="/dashboard/admin/communications" className="text-sm text-muted-foreground hover:underline">
          ← Comunicaciones
        </Link>
      </PageHeader>

      {conversations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {conversations.map((conversation) => (
            <Card key={conversation.id}>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{conversation.subject}</h2>
                  <Badge variant="outline">
                    {conversation.participants.map((p) => p.user.name).join(' · ')}
                  </Badge>
                </div>

                <div className="mb-4 flex flex-col gap-3">
                  {conversation.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages in this conversation.</p>
                  ) : (
                    conversation.messages.map((message) => {
                      const mine = message.senderId === session.user.id;
                      return (
                        <div
                          key={message.id}
                          className={`max-w-[85%] rounded-lg border border-border p-3 ${
                            mine ? 'self-end bg-primary/10' : 'self-start bg-muted/40'
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs font-semibold">{message.sender.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {message.createdAt.toLocaleString('es', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed">{message.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form action={createMessageAction} className="flex items-center gap-2">
                  <input type="hidden" name="conversationId" value={conversation.id} />
                  <textarea
                    required
                    name="body"
                    rows={2}
                    placeholder="Escribe una respuesta…"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Responder
                  </button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


