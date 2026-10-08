import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureRedirect } from '../../helpers/redirect';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  postCreate: vi.fn(),
  postFindUnique: vi.fn(),
  postUpdate: vi.fn(),
  postDelete: vi.fn(),
  likeFindUnique: vi.fn(),
  likeCreate: vi.fn(),
  likeDelete: vi.fn(),
  commentCreate: vi.fn(),
  commentFindUnique: vi.fn(),
  commentDelete: vi.fn(),
  reportUpsert: vi.fn(),
  opportunityFindUnique: vi.fn(),
  notifyUser: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('@ifpc/auth', () => ({ auth: mocks.auth }));
vi.mock('@ifpc/database', () => ({
  prisma: {
    post: {
      create: mocks.postCreate,
      findUnique: mocks.postFindUnique,
      update: mocks.postUpdate,
      delete: mocks.postDelete,
    },
    postLike: {
      findUnique: mocks.likeFindUnique,
      create: mocks.likeCreate,
      delete: mocks.likeDelete,
    },
    postComment: {
      create: mocks.commentCreate,
      findUnique: mocks.commentFindUnique,
      delete: mocks.commentDelete,
    },
    postReport: { upsert: mocks.reportUpsert },
    opportunity: { findUnique: mocks.opportunityFindUnique },
  },
}));
vi.mock('@/lib/notifications/notify', () => ({ notifyUser: mocks.notifyUser }));
vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  writeFile: mocks.writeFile,
  unlink: mocks.unlink,
}));

import {
  createCommentAction,
  createPostAction,
  deleteCommentAction,
  deletePostAction,
  moderatePostAction,
  reportPostAction,
  toggleLikeAction,
  updatePostAction,
} from '@/app/actions/discovery';

/** Fichero de prueba (imagen o vídeo). */
function file(type: string, bytes = 1024, name = 'archivo.png'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function form(fields: Record<string, string | File> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: 'user-1', name: 'Ana Ruiz', role: 'CLUB' } });
  mocks.postCreate.mockResolvedValue({ id: 'post-1' });
  mocks.postFindUnique.mockResolvedValue({ id: 'post-1', authorId: 'user-1', status: 'PUBLISHED' });
  mocks.postUpdate.mockResolvedValue({});
  mocks.postDelete.mockResolvedValue({});
  mocks.likeFindUnique.mockResolvedValue(null);
  mocks.likeCreate.mockResolvedValue({});
  mocks.commentCreate.mockResolvedValue({ id: 'comment-1' });
  mocks.reportUpsert.mockResolvedValue({});
  mocks.opportunityFindUnique.mockResolvedValue({ id: 'opp-1' });
  mocks.notifyUser.mockResolvedValue(undefined);
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.unlink.mockResolvedValue(undefined);
});

describe('createPostAction', () => {
  it('exige sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await createPostAction({}, form({ body: 'hola' }));
    expect(result).toEqual({ error: 'Tu perfil no puede publicar.' });
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('publica un anuncio de texto y vuelve al feed', async () => {
    const target = await captureRedirect(() => createPostAction({}, form({ body: 'Nuevo fichaje' })));

    expect(target).toBe('/dashboard/discovery');
    expect(mocks.postCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorId: 'user-1',
        type: 'ANNOUNCEMENT',
        body: 'Nuevo fichaje',
        mediaUrl: null,
      }),
    });
  });

  it('rechaza publicaciones sin contenido', async () => {
    const result = await createPostAction({}, form({ body: '   ' }));
    expect(result.error).toBeDefined();
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('normaliza los hashtags del texto y de las etiquetas', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Buen #Partido', tags: '#previa ultimo' }))
    );

    expect(mocks.postCreate.mock.calls[0][0].data.tags).toEqual(['previa', 'ultimo', 'partido']);
  });

  it('sube una imagen y la publica como foto', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Entreno', file: file('image/png') }))
    );

    const data = mocks.postCreate.mock.calls[0][0].data;
    expect(data.type).toBe('PHOTO');
    expect(data.mediaKind).toBe('image');
    expect(data.mediaUrl).toMatch(/^\/uploads\/posts\/.+\.png$/);
    expect(mocks.writeFile).toHaveBeenCalledTimes(1);
  });

  it('sube un vídeo y lo publica como vídeo', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Highlights', file: file('video/mp4', 2048, 'v.mp4') }))
    );

    const data = mocks.postCreate.mock.calls[0][0].data;
    expect(data.type).toBe('VIDEO');
    expect(data.mediaKind).toBe('video');
  });

  it('rechaza ficheros que no son imagen ni vídeo permitidos', async () => {
    const result = await createPostAction(
      {},
      form({ body: 'x', file: file('application/pdf', 1024, 'doc.pdf') })
    );
    expect(result.error).toContain('JPG, PNG, WebP');
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('rechaza imágenes por encima del máximo', async () => {
    const result = await createPostAction(
      {},
      form({ body: 'x', file: file('image/png', 5 * 1024 * 1024) })
    );
    expect(result.error).toContain('supera el máximo');
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('acepta un vídeo de YouTube y guarda la URL de incrustación', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Mira', mediaUrl: 'https://youtu.be/M7lc1UVf-VE' }))
    );

    const data = mocks.postCreate.mock.calls[0][0].data;
    expect(data.mediaKind).toBe('embed');
    expect(data.mediaUrl).toBe('https://www.youtube.com/embed/M7lc1UVf-VE');
    expect(data.type).toBe('VIDEO');
  });

  it('rechaza enlaces externos que no estén en la lista blanca', async () => {
    const result = await createPostAction(
      {},
      form({ body: 'x', mediaUrl: 'https://evil.example/watch?v=M7lc1UVf-VE' })
    );
    expect(result.error).toContain('YouTube or Vimeo');
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('no publica un tipo Foto o Vídeo sin medio adjunto', async () => {
    const result = await createPostAction({}, form({ body: 'solo texto', type: 'PHOTO' }));
    expect(result.error).toContain('Attach the file');
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('descarta una oportunidad que no existe', async () => {
    mocks.opportunityFindUnique.mockResolvedValue(null);
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Buscamos', opportunityId: 'inexistente' }))
    );
    expect(mocks.postCreate.mock.calls[0][0].data.opportunityId).toBeNull();
  });

  it('adjunta la oportunidad cuando existe', async () => {
    await captureRedirect(() =>
      createPostAction({}, form({ body: 'Buscamos', opportunityId: 'opp-1' }))
    );
    expect(mocks.postCreate.mock.calls[0][0].data.opportunityId).toBe('opp-1');
  });
});

describe('updatePostAction', () => {
  it('solo permite editar las publicaciones propias', async () => {
    mocks.postFindUnique.mockResolvedValue({ id: 'post-1', authorId: 'otro' });

    const result = await updatePostAction({}, form({ postId: 'post-1', body: 'editado' }));
    expect(result).toEqual({ error: 'You can only edit your own posts.' });
    expect(mocks.postUpdate).not.toHaveBeenCalled();
  });

  it('guarda el texto y vuelve al detalle', async () => {
    const target = await captureRedirect(() =>
      updatePostAction({}, form({ postId: 'post-1', title: 'Título', body: 'editado' }))
    );

    expect(target).toBe('/dashboard/discovery/post-1');
    expect(mocks.postUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { title: 'Título', body: 'editado', tags: [] },
    });
  });

  it('rechaza dejar la publicación vacía', async () => {
    const result = await updatePostAction({}, form({ postId: 'post-1', body: '   ' }));
    expect(result.error).toBeDefined();
    expect(mocks.postUpdate).not.toHaveBeenCalled();
  });
});

describe('deletePostAction', () => {
  it('no borra nada sin sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    await captureRedirect(() => deletePostAction(form({ postId: 'post-1' })));
    expect(mocks.postDelete).not.toHaveBeenCalled();
  });

  it('no permite borrar publicaciones de otros', async () => {
    mocks.postFindUnique.mockResolvedValue({ id: 'post-1', authorId: 'otro', mediaUrl: null });
    await captureRedirect(() => deletePostAction(form({ postId: 'post-1' })));
    expect(mocks.postDelete).not.toHaveBeenCalled();
  });

  it('borra la publicación propia y su archivo local', async () => {
    mocks.postFindUnique.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-1',
      mediaUrl: '/uploads/posts/abc.png',
    });

    const target = await captureRedirect(() =>
      deletePostAction(form({ postId: 'post-1', redirectTo: '/dashboard/discovery' }))
    );

    expect(mocks.postDelete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
    expect(target).toBe('/dashboard/discovery');
  });

  it('un admin puede borrar cualquier publicación', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } });
    mocks.postFindUnique.mockResolvedValue({ id: 'post-1', authorId: 'otro', mediaUrl: null });

    await captureRedirect(() => deletePostAction(form({ postId: 'post-1' })));
    expect(mocks.postDelete).toHaveBeenCalled();
  });

  it('no borra ficheros que no son del feed', async () => {
    mocks.postFindUnique.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-1',
      mediaUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
    });

    await captureRedirect(() => deletePostAction(form({ postId: 'post-1' })));
    expect(mocks.unlink).not.toHaveBeenCalled();
  });
});

describe('toggleLikeAction', () => {
  it('no hace nada sin sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    await toggleLikeAction(form({ postId: 'post-1' }));
    expect(mocks.likeCreate).not.toHaveBeenCalled();
  });

  it('no interactúa con publicaciones ocultas', async () => {
    mocks.postFindUnique.mockResolvedValue({ authorId: 'otro', status: 'HIDDEN' });
    await toggleLikeAction(form({ postId: 'post-1' }));
    expect(mocks.likeCreate).not.toHaveBeenCalled();
  });

  it('añade el me gusta y avisa al autor', async () => {
    mocks.postFindUnique.mockResolvedValue({ authorId: 'otro', status: 'PUBLISHED' });

    await toggleLikeAction(form({ postId: 'post-1' }));

    expect(mocks.likeCreate).toHaveBeenCalledWith({ data: { postId: 'post-1', userId: 'user-1' } });
    expect(mocks.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'otro', link: '/dashboard/discovery/post-1' })
    );
  });

  it('quita el me gusta existente sin avisar', async () => {
    mocks.postFindUnique.mockResolvedValue({ authorId: 'otro', status: 'PUBLISHED' });
    mocks.likeFindUnique.mockResolvedValue({ id: 'like-1' });

    await toggleLikeAction(form({ postId: 'post-1' }));

    expect(mocks.likeDelete).toHaveBeenCalledWith({ where: { id: 'like-1' } });
    expect(mocks.likeCreate).not.toHaveBeenCalled();
    expect(mocks.notifyUser).not.toHaveBeenCalled();
  });

  it('no avisa al darse me gusta en la propia publicación', async () => {
    await toggleLikeAction(form({ postId: 'post-1' }));
    expect(mocks.likeCreate).toHaveBeenCalled();
    expect(mocks.notifyUser).not.toHaveBeenCalled();
  });
});

describe('createCommentAction', () => {
  it('exige sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await createCommentAction({}, form({ postId: 'post-1', body: 'hola' }));
    expect(result).toEqual({ error: 'Invalid session.' });
  });

  it('rechaza comentarios vacíos', async () => {
    const result = await createCommentAction({}, form({ postId: 'post-1', body: '  ' }));
    expect(result.error).toBeDefined();
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });

  it('rechaza comentar una publicación oculta o inexistente', async () => {
    mocks.postFindUnique.mockResolvedValue({ authorId: 'otro', status: 'HIDDEN' });
    const result = await createCommentAction({}, form({ postId: 'post-1', body: 'hola' }));
    expect(result).toEqual({ error: 'Publication not found.' });
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });

  it('publica el comentario, avisa al autor y revalida', async () => {
    mocks.postFindUnique.mockResolvedValue({ authorId: 'otro', status: 'PUBLISHED' });

    const result = await createCommentAction({}, form({ postId: 'post-1', body: 'Muy bueno' }));

    expect(mocks.commentCreate).toHaveBeenCalledWith({
      data: {
        postId: 'post-1',
        authorId: 'user-1',
        parentId: null,
        body: 'Muy bueno',
      },
    });
    expect(mocks.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'otro', type: 'post_comment' })
    );
    expect(result).toEqual({ success: 'Comment published.' });
  });

  it('acepta respuestas indicando el comentario padre', async () => {
    await createCommentAction({}, form({ postId: 'post-1', parentId: 'comment-9', body: 'Total' }));
    expect(mocks.commentCreate.mock.calls[0][0].data.parentId).toBe('comment-9');
  });
});

describe('deleteCommentAction', () => {
  it('permite borrar el comentario propio', async () => {
    mocks.commentFindUnique.mockResolvedValue({
      authorId: 'user-1',
      postId: 'post-1',
      post: { authorId: 'otro' },
    });

    await deleteCommentAction(form({ commentId: 'comment-1' }));
    expect(mocks.commentDelete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
  });

  it('permite al autor del post moderar sus comentarios', async () => {
    mocks.commentFindUnique.mockResolvedValue({
      authorId: 'otro',
      postId: 'post-1',
      post: { authorId: 'user-1' },
    });

    await deleteCommentAction(form({ commentId: 'comment-1' }));
    expect(mocks.commentDelete).toHaveBeenCalled();
  });

  it('no permite borrar comentarios ajenos', async () => {
    mocks.commentFindUnique.mockResolvedValue({
      authorId: 'otro',
      postId: 'post-1',
      post: { authorId: 'tercero' },
    });

    await deleteCommentAction(form({ commentId: 'comment-1' }));
    expect(mocks.commentDelete).not.toHaveBeenCalled();
  });
});

describe('reportPostAction', () => {
  it('exige sesión', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await reportPostAction({}, form({ postId: 'post-1', reason: 'spam' }));
    expect(result).toEqual({ error: 'Invalid session.' });
  });

  it('exige un motivo con contenido', async () => {
    const result = await reportPostAction({}, form({ postId: 'post-1', reason: 'x' }));
    expect(result.error).toBeDefined();
    expect(mocks.reportUpsert).not.toHaveBeenCalled();
  });

  it('registra la denuncia una sola vez por persona', async () => {
    const result = await reportPostAction(
      {},
      form({ postId: 'post-1', reason: 'Contenido ofensivo' })
    );

    expect(mocks.reportUpsert).toHaveBeenCalledWith({
      where: { postId_reporterId: { postId: 'post-1', reporterId: 'user-1' } },
      update: { reason: 'Contenido ofensivo' },
      create: { postId: 'post-1', reporterId: 'user-1', reason: 'Contenido ofensivo' },
    });
    expect(result).toEqual({ success: 'Thanks, our team will review it.' });
  });
});

describe('moderatePostAction', () => {
  it('solo los admin pueden moderar', async () => {
    await moderatePostAction(form({ postId: 'post-1', status: 'HIDDEN' }));
    expect(mocks.postUpdate).not.toHaveBeenCalled();
  });

  it('oculta una publicación cuando lo pide un admin', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } });

    await moderatePostAction(form({ postId: 'post-1', status: 'HIDDEN' }));

    expect(mocks.postUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { status: 'HIDDEN' },
    });
  });

  it('ignora estados no permitidos', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' } });
    await moderatePostAction(form({ postId: 'post-1', status: 'DRAFT' }));
    expect(mocks.postUpdate).not.toHaveBeenCalled();
  });
});
