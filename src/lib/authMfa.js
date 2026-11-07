import api from "@/lib/api";

export async function loginWithMfa(email, password) {
  return await api.auth.loginViaEmailPassword(email, password);
}

export async function continueMfa(result, returnTo) {
  if (typeof window !== "undefined") {
    window.location.href = returnTo || "/";
  }
}

export async function loginWithSocial(provider, returnTo) {
  return api.auth.loginWithProvider(provider, returnTo);
}

export function loginWithGoogle(returnTo) {
  return loginWithSocial("google", returnTo);
}
