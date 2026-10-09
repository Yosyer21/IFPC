import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  postCreate: vi.fn(),
  postFindFirst: vi.fn(),
  postCount: vi.fn(),
  postUpdate: vi.fn(),
  pollUpsert: vi.fn(),
  moderationCreate: vi.fn(),
  userFindMany: vi.fn(),
  notifyGrouped: vi.fn(),
  revalidatePath: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/revalidate', () => ({ revalidatePaths: mocks.revalidatePath }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    post: {
      create: mocks.postCreate,
      findFirst: mocks.postFindFirst,
      count: mocks.postCount,
      update: mocks.postUpdate,
    },
    postPollVote: { upsert: mocks.pollUpsert },
    moderationLog: { create: mocks.moderationCreate },
    user: { findMany: mocks.userFindMany },
  },
}));
vi.mock('@/lib/notifications/notify', () => ({
  notifyUser: vi.fn(),
  notifyGrouped: mocks.notifyGrouped,
}));
vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  writeFile: mocks.writeFile,
  unlink: mocks.unlink,
}));

import {
  createPostAction,
  publishDraftAction,
  votePollAction,
} from '@/app/actions/discovery';

/** Fichero de prueba (imagen o vídeo). */
function file(type: string, bytes = 1024, name = 'archivo.png'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** Formulario que admite el mismo campo repetido (galería y opciones de encuesta). */
function form(fields: Record<string, string | File | File[]> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const entry of value) formData.append(key, entry);
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1', name: 'Ana Ruiz', role: 'CLUB' } });
  mocks.postCreate.mockResolvedValue({ id: 'post-1' });
  mocks.postFindFirst.mockResolvedValue(null);
  mocks.postCount.mockResolvedValue(0);
  mocks.postUpdate.mockResolvedValue({});
  mocks.pollUpsert.mockResolvedValue({});
  mocks.moderationCreate.mockResolvedValue({});
  mocks.userFindMany.mockResolvedValue([]);
  mocks.notifyGrouped.mockResolvedValue(undefined);
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.unlink.mockResolvedValue(undefined);
});

describe('createPostAction: galería y accesibilidad', () => {
  it('sube varias imágenes y guarda la galería con texto alternativo', async () => {
    await captureRedirect(() =>
      createPostAction(
        {},
        form({
          body: 'Entreno de hoy',
          mediaAlt: 'El equipo calentando',
          files: [
            file('image/png', 1024, 'a.png'),
            file('image/jpeg', 1024, 'b.jpg'),
            file('image/webp', 1024, 'c.webp'),
          ],
        })
      )
    );

    const data = mocks.postCreate.mock.calls[0][0].data;
    expect(data.mediaUrls).toHaveLength(3);
    expect(data.mediaUrls[0]).toMatch(/^\/uploads\/posts\/.+\.(png|jpg|webp)$/);
    expect(data.mediaUrl).toBe(data.mediaUrls[0]);
    expect(data.mediaKind).toBe('image');
    expect(data.type).toBe('PHOTO');
    expect(data.mediaAlt).toBe('El equipo calentando');
    expect(mocks.writeFile).toHaveBeenCalledTimes(3);
  });

  it('la galería solo admite imágenes', async () => {
    const result = await createPostAction(
      {},
      form({ body: 'x', files: [file('video/mp4', 2048, 'v.mp4')] })
    );

    expect(result.error).toContain('solo admite imágenes');
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('recorta la galería a cuatro imágenes', async () => {
    await captureRedirect(() =>
      createPostAction(
        {},
        form({
          body: 'Cinco fotos',
          files: [1, 2, 3, 4, 5].map((index) => file('image/png', 1024, `f${index}.png`)),
        })
      )
    );

    expect(mocks.postCreate.mock.calls[0][0].data.mediaUrls).toHaveLength(4);
    expect(mocks.writeFile).toHaveBeenCalledTimes(4);
  });
});

describe('createPostAction: encuesta', () => {
  it('guarda las opciones limpias y sin repetir', async () => {
    await captureRedirect(() =>
      createPostAction(
        {},
        form({ body: '¿Jugamos?', pollOption: [' Sí ', 'Sí', 'No', '  '] })
      )
    );

    expect(mocks.postCreate.mock.calls[0][0].data.pollOptions).toEqual(['Sí', 'No']);
  });

  it('con una sola opción no hay encuesta', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Sin encuesta', pollOption: ['Solo una'] }))
    );

    expect(mocks.postCreate.mock.calls[0][0].data.pollOptions).toEqual([]);
  });

  it('admite como máximo cuatro opciones', async () => {
    await captureRedirect(() =>
      createPostAction(
        {},
        form({ body: 'Muchas', pollOption: ['A', 'B', 'C', 'D', 'E'] })
      )
    );

    expect(mocks.postCreate.mock.calls[0][0].data.pollOptions).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('createPostAction: borradores y programación', () => {
  it('guarda un borrador sin avisar a nadie', async () => {
    const target = await captureRedirect(() =>
      createPostAction({}, form({ body: 'Mañana lo cuento', intent: 'draft' }))
    );

    expect(mocks.postCreate.mock.calls[0][0].data.status).toBe('DRAFT');
    expect(target).toBe('/dashboard/discovery');
    expect(mocks.notifyGrouped).not.toHaveBeenCalled();
  });

  it('una fecha futura se guarda como programada', async () => {
    const publishAt = new Date(Date.now() + 3600 * 1000).toISOString();
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Convocatoria', publishAt }))
    );

    const data = mocks.postCreate.mock.calls[0][0].data;
    expect(data.status).toBe('DRAFT');
    expect(data.publishAt).toBeInstanceOf(Date);
  });

  it('una fecha pasada publica al momento y desfasa la programación', async () => {
    const publishAt = new Date(Date.now() - 60 * 1000).toISOString();
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Ya toca', publishAt }))
    );

    expect(mocks.postCreate.mock.calls[0][0].data.status).toBe('PUBLISHED');
  });

  it('rechaza una fecha de programación inválida', async () => {
    const result = await createPostAction({}, form({ body: 'x', publishAt: 'mañana' }));

    expect(result.error).toContain('no es válida');
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('un borrador con lenguaje prohibido sigue siendo borrador', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'qué idiota soy', intent: 'draft' }))
    );

    expect(mocks.postCreate.mock.calls[0][0].data.status).toBe('DRAFT');
    expect(mocks.moderationCreate).not.toHaveBeenCalled();
  });

  it('una publicación con lenguaje prohibido queda oculta y con registro', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'qué idiota soy' }))
    );

    expect(mocks.postCreate.mock.calls[0][0].data.status).toBe('HIDDEN');
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'HIDDEN' }) })
    );
  });
});

describe('createPostAction: menciones', () => {
  it('avisa a los perfiles mencionados y nunca al autor', async () => {
    mocks.userFindMany.mockResolvedValue([{ id: 'club-2', name: 'Demo Club' }]);

    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Gracias @Demo Club por la convocatoria' }))
    );

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { not: 'user-1' },
          OR: [{ name: { equals: 'Demo Club', mode: 'insensitive' } }],
        },
      })
    );
    expect(mocks.notifyGrouped).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'club-2',
        type: 'post_mention',
        link: '/dashboard/discovery/post-1',
      })
    );
  });

  it('sin menciones no busca perfiles ni avisa', async () => {
    await captureRedirect(() => createPostAction({}, form({ body: 'Sin menciones' })));

    expect(mocks.userFindMany).not.toHaveBeenCalled();
    expect(mocks.notifyGrouped).not.toHaveBeenCalled();
  });

  it('un aviso fallido no rompe la publicación', async () => {
    mocks.userFindMany.mockResolvedValue([{ id: 'club-2', name: 'Demo Club' }]);
    mocks.notifyGrouped.mockRejectedValue(new Error('boom'));

    const target = await captureRedirect(() =>
      createPostAction({}, form({ body: 'Hola @Demo Club' }))
    );

    expect(mocks.postCreate).toHaveBeenCalled();
    expect(target).toBe('/dashboard/discovery');
  });
});

describe('votePollAction', () => {
  it('sin sesión no vota', async () => {
    mocks.auth.mockResolvedValue(null);

    await votePollAction(form({ postId: 'post-1', optionIndex: '0' }));

    expect(mocks.pollUpsert).not.toHaveBeenCalled();
  });

  it('ignora publicaciones que no existen o no tienen encuesta', async () => {
    await votePollAction(form({ postId: 'post-1', optionIndex: '0' }));
    expect(mocks.pollUpsert).not.toHaveBeenCalled();

    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', pollOptions: [] });
    await votePollAction(form({ postId: 'post-1', optionIndex: '0' }));
    expect(mocks.pollUpsert).not.toHaveBeenCalled();
  });

  it('ignora una opción fuera de rango', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', pollOptions: ['Sí', 'No'] });

    await votePollAction(form({ postId: 'post-1', optionIndex: '7' }));

    expect(mocks.pollUpsert).not.toHaveBeenCalled();
  });

  it('registra el voto y revalida el feed y el detalle', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', pollOptions: ['Sí', 'No'] });

    await votePollAction(form({ postId: 'post-1', optionIndex: '1' }));

    expect(mocks.pollUpsert).toHaveBeenCalledWith({
      where: { postId_userId: { postId: 'post-1', userId: 'user-1' } },
      create: { postId: 'post-1', userId: 'user-1', optionIndex: 1 },
      update: { optionIndex: 1 },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      '/dashboard/discovery',
      '/dashboard/discovery/post-1'
    );
  });

  it('votar de nuevo cambia la opción elegida', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', pollOptions: ['Sí', 'No'] });

    await votePollAction(form({ postId: 'post-1', optionIndex: '0', from: '/dashboard/discovery' }));

    expect(mocks.pollUpsert.mock.calls[0][0].update).toEqual({ optionIndex: 0 });
  });

  it('un fallo al votar no rompe nada', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', pollOptions: ['Sí', 'No'] });
    mocks.pollUpsert.mockRejectedValue(new Error('boom'));

    await expect(
      votePollAction(form({ postId: 'post-1', optionIndex: '0' }))
    ).resolves.toBeUndefined();
  });
});

describe('publishDraftAction', () => {
  it('sin sesión no publica', async () => {
    mocks.auth.mockResolvedValue(null);

    await publishDraftAction(form({ postId: 'post-1' }));

    expect(mocks.postUpdate).not.toHaveBeenCalled();
  });

  it('no publica el borrador de otra persona', async () => {
    await publishDraftAction(form({ postId: 'post-1' }));

    expect(mocks.postFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1', authorId: 'user-1', status: 'DRAFT' },
      })
    );
    expect(mocks.postUpdate).not.toHaveBeenCalled();
  });

  it('publica el borrador propio y lleva al detalle', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', title: 'Convoca', body: 'texto' });

    const target = await captureRedirect(() => publishDraftAction(form({ postId: 'post-1' })));

    expect(mocks.postUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { status: 'PUBLISHED' },
    });
    expect(target).toBe('/dashboard/discovery/post-1');
  });

  it('si el texto tiene lenguaje prohibido se publica oculto y con registro', async () => {
    mocks.postFindFirst.mockResolvedValue({ id: 'post-1', title: null, body: 'eres un idiota' });

    await captureRedirect(() => publishDraftAction(form({ postId: 'post-1' })));

    expect(mocks.postUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { status: 'HIDDEN' },
    });
    expect(mocks.moderationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'HIDDEN' }) })
    );
  });
});

