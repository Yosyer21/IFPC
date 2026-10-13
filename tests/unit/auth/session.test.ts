import { describe, expect, it } from 'vitest';
import { isSecureRequest } from '../../../packages/auth/src/session';

/**
 * Auth.js usa el nombre de la cookie de sesión como `salt` del JWT: en HTTPS es
 * `__Secure-authjs.session-token` y en HTTP `authjs.session-token`. El middleware
 * debe detectar el protocolo para poder descifrar el token (bug que dejaba el
 * dashboard inaccesible en Railway, donde la app va por HTTPS).
 */
describe('isSecureRequest', () => {
  it('detecta HTTPS a través de x-forwarded-proto (proxy)', () => {
    expect(isSecureRequest(new Headers({ 'x-forwarded-proto': 'https' }))).toBe(true);
  });

  it('trata HTTP como no seguro', () => {
    expect(isSecureRequest(new Headers({ 'x-forwarded-proto': 'http' }))).toBe(false);
  });

  it('usa el primer valor cuando hay varios proxies encadenados', () => {
    expect(isSecureRequest(new Headers({ 'x-forwarded-proto': 'https, http' }))).toBe(true);
    expect(isSecureRequest(new Headers({ 'x-forwarded-proto': 'http, https' }))).toBe(false);
  });

  it('ignora mayúsculas y espacios', () => {
    expect(isSecureRequest(new Headers({ 'x-forwarded-proto': ' HTTPS ' }))).toBe(true);
  });

  it('cae al protocolo del request cuando no hay cabecera', () => {
    expect(isSecureRequest(new Headers(), 'https:')).toBe(true);
    expect(isSecureRequest(new Headers(), 'http:')).toBe(false);
  });

  it('sin cabecera ni protocolo no considera la petición segura', () => {
    expect(isSecureRequest(new Headers())).toBe(false);
    expect(isSecureRequest(new Headers(), null)).toBe(false);
  });
});
