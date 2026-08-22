import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@ifpc/auth';
import { prisma } from '@ifpc/database';
import { Badge, Card, CardContent } from '@ifpc/ui';
import { PageHeader } from '@/components/player/page-header';
import { IconMail } from '@/components/dashboard/icons';
import { sendMessageAction } from '@/app/actions/agent';

export const metadata: Metadata = { title: 'Comunicaciones' };

export default async function AgentCommunicationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) notFound();

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: session.user.id } } },
    include: {
      participants: { include: { user: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Comunicaciones"
        subtitle="Mensajes con clubes, jugadores y la plataforma"
        icon="mail"
      />

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconMail className="h-7 w-7" />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              Aún no tienes conversaciones. Cuando un club o la plataforma te escriba, aparecerá
              aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {conversations.map((conversation) => {
            const last = conversation.messages[conversation.messages.length - 1];
            return (
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
                      <p className="text-sm text-muted-foreground">Sin mensajes todavía.</p>
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

                  <form action={sendMessageAction} className="flex items-center gap-2">
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
            );
          })}
        </div>
      )}
    </div>
  );
}


