import { describe, expect, it } from 'vitest';
import { publicUserSelect, contactUserSelect, adminUserSelect } from '@/lib/api/user-select';

describe('API user selects', () => {
  it('nunca exponen el hash de contraseña', () => {
    expect(publicUserSelect).not.toHaveProperty('passwordHash');
    expect(contactUserSelect).not.toHaveProperty('passwordHash');
    expect(adminUserSelect).not.toHaveProperty('passwordHash');
  });

  it('separan directorio público, contacto y administración', () => {
    expect(publicUserSelect).not.toHaveProperty('email');
    expect(contactUserSelect).toHaveProperty('email');
    expect(adminUserSelect).toHaveProperty('emailVerified');
  });
});
