export type MockSession = {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
};

const SESSION_KEY = 'direitofacil.mock-session.v1';

export function loadMockSession(): MockSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

export function createMockSession({ name, email }: { name?: string; email: string }) {
  const session: MockSession = {
    userId: `mock-${email.trim().toLowerCase()}`,
    name: name?.trim() || email.split('@')[0] || 'Aluno',
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearMockSession() {
  if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
}

export function nextRouteAfterAuth() {
  if (typeof window === 'undefined') return '/onboarding';
  return localStorage.getItem('oab-onboarding-complete') === 'true' ? '/hoje' : '/onboarding';
}
