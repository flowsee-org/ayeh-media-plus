import { base44 } from '@/api/base44Client';

export async function loginWithMfa(email, password) {
  return await base44.auth.loginViaEmailPassword(email, password);
}

export async function continueMfa(result, returnTo) {
  window.location.assign(returnTo || '/');
}

export async function loginWithSocial(provider, returnTo) {
  return base44.auth.loginWithProvider(provider, returnTo);
}

export function loginWithGoogle(returnTo) {
  return loginWithSocial('google', returnTo);
}
